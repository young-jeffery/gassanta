# HANDOVER: Secret Santa site, continuing from Stage 3 into Stage 4

Paste or upload this file at the start of the new chat, then say which stage to start. Everything below is what the previous
thread decided, built, learned and left open. The repo is on the user's machine and readable through the filesystem extension.
**Read `docs/PROJECT-MAP.md` in the repo first**: it lists every file, what it does and where to change things.

## 0. First things to do in the new chat
1. **Save memory before using any connector/tool**: in the previous thread, memory writes were blocked because a filesystem
   connector had already been used, so the Stage 3 decisions below were NOT saved. In the first turn, before reading the repo, file
   the durable facts in section 9 into the project memory area file (`secret-santa-site.md`).
2. Read `docs/PROJECT-MAP.md`, then skim `src/App.jsx`, `firestore.rules`, `src/groups/GroupProvider.jsx`.
3. Ask which of the user's pending test notes (section 8) came back, then plan Stage 3.5 / Stage 4 and **wait for "go"**.

## 1. Who and what
- User: JoJo (final-year CS student, Lagos). Building a Secret Santa site for himself and friends; a second friend group wants theirs too,
  so the site is **multi-group**. Not commercialised yet. First group: "Curia VI", 2026 edition (~10 people).
- Repo: `C:\Users\mayow\Documents\Web\Secret Santa\Secret-Santa-God-Abeg` (public GitHub repo; deployed on Netlify, default domain, no custom domain).
- Stack: React 19, Vite 7, Tailwind CSS 4, GSAP (+ @gsap/react), react-router 7, Firebase 12 (Auth + Firestore), howler (music). `firebase-admin` is a
  dev dependency for `scripts/seed-group.mjs`. Netlify Functions are planned for Stage 4/6 (none exist yet). Testing devices: iPhone 13 (Brave),
  Galaxy S20 (the weak one), iPhone XR; desktop.

## 2. How the user wants to work (important)
- **Detailed, step-by-step instructions**; never assume he knows how to do something. At the start of every new phase/stage give the **plan and order
  of action and WAIT for his explicit "go"** before implementing. He prefers to review and apply changes himself (hands-on).
- Deliver code as a **zip containing complete files at repo-relative paths**, plus a clear list of files to delete. He extracts over the repo.
  Always say which files to delete and run `npm run lint` and `npm run build` after applying. **Never tell him to delete a file without first making
  sure nothing imports it** (a past mistake: `Home.jsx` was listed as cleanup while `App.jsx` still imported it).
- Never use `npm audit fix --force`. Keep Firebase credentials out of the repo (service-account keys live outside it).
- Standing user preferences in the Claude project: zero conversational fluff, dense answers; a message counter with a warning at message 15 and 20
  offering a context summary; optional one-line token-saving tips. (The previous thread ran far past 20 messages; this handover is that summary.)
- The project instructions also ask for the feasibility / relevance / potential / state-of-the-art / monetization template for NEW ideas.
- He asks for design details often and notices small visual things (alignment, hover polish, colour). Check visuals before delivering.
- Decisions he already made are final unless he reopens them. Ask questions only when truly needed, with a recommendation.

## 3. Product decisions (what the site is)
- **Flow**: landing page > register with a join code (or log in) > dashboard. Stages per group: `registration` > `preferences` > `awaiting_draw` > `drawn`.
  Participants see all phase cards with status tags; they can only act in the open one. Admin can roll stages back.
- **Gacha-style reveal** (Stage 7): ~10 people; each person's reveal video plays one after another on gifting day, then that person gifts their giftee.
  Reveals are autoplay (click to start, no shake/drag). Tier (effects only, not length) depends on whether you got who you wanted. Participants see only their own
  result and can replay it. Earlier plan was 5 reveals (snow globe, sleigh drop, letter to Santa, tree lighting, ornament crack); **the user now says limit to 1 or
  2 and redesign how it is done for performance** (decide method together: e.g. one reusable lightweight scene with variants, CSS/SVG, or pre-rendered clips;
  Lottie/Rive were considered because he can't draw and has no budget for paid art).
- **Preferences (Stage 5)**: picking a giftee/gifter raises the odds; mutual picks raise them more; participants may opt out of picking.
- **Notifications (Stage 6)**: automated email when phases open (+ a `wa.me` WhatsApp share button; no WhatsApp API).
- **Wishlist**: up to 10 items + 500-character hints, editable until the draw, visible only to the person's gifter after the draw (admins cannot read it).
- **Nicknames** are what everyone sees (and shown in reveals); **real names** only to admins and the person. Nicknames are unique per group.
- **Roles per group**: `owner` (creator), `admin`, `member`. Owner promotes/demotes; planned "request admin" flow (member requests, owner accepts/declines).
- **Deadlines**: one per stage (registration, preferences) plus a gifting date, set by admin; **display-only** (nothing auto-closes).
- **Landing page**: signed out shows no group name; signed in shows the group's name/tag/year in the "Curia VI / 2026 Edition" slot. "Enter" goes to the
  dashboard when signed in (blizzard transition), else to `/register`.
- **Lite mode**: a static, no-animation version for weak phones (dock button, quiet link on the landing page, or `?lite=1`). Keeps fairy lights (still),
  sun/moon toggle (instant), buttons' effects, snowmen eye tracking.
- **Visual style**: Christmas; palettes (7, day/night variants); mobile-first; on desktop content uses ~80% of the width, left-aligned; scrollbar hidden everywhere;
  `svh` units (never `dvh`). Register/login: snowmen (desktop trio beside the form; one peeking over the card on phones; the form is stepped into 3 steps on phones).
  Dashboard cards: solid colours, charcoal "chat bubble" outline + tail, wavy contrasting strip, corner doodles, hover/tap reaction with cooldown; the rules card is a
  Christmas rulebook; the wishlist becomes a wrapped present after the draw.
- Sounds on every page (soft tick on buttons, rising notes on fields, thump on errors, door on page change), own mute switch separate from music.

## 4. Architecture (details in PROJECT-MAP.md)
- **Firestore model** (gid = URL slug): `users/{uid}` (email, createdAt, lastGroup, groups[]), `joinCodes/{CODE}` (gid, active), `groups/{gid}` (name, tag, year, stage,
  deadlines{registration,preferences,gifting}, createdBy), `groups/{gid}/content/rules`, `.../members/{uid}` (nickname, nicknameKey, role, joinedAt, verified, joinCode),
  `.../memberPrivate/{uid}` (realName), `.../nicknames/{key}` (uid), `.../wishlists/{uid}`; planned `.../picks/{uid}` (owner-only), `.../results/{uid}` (server-written,
  owner-read; the wishlist rule already expects `results/{gifterUid}.gifteeUid`).
- **Rules** (`firestore.rules`, pasted into the Console; Admin SDK bypasses them): joining is one atomic batch using `existsAfter/getAfter`; stage-gated; join code checked via a
  `get()` on `joinCodes`; members can only set their own `verified` to true; admins edit stage/deadlines/name/rules; owner changes roles. Group creation from the browser is
  currently **denied**; groups are created by `scripts/seed-group.mjs` (Admin SDK).
- **Client structure**: `AuthProvider` > `GroupProvider` (memberships from `users.groups` with fallback to `lastGroup`; active group from the URL, else last used; live listeners; retries
  the member-doc listener when a just-joined membership hasn't reached the server) > route guards > pages. Registration: create Auth account, then one batch writes
  user + member + memberPrivate + nickname; on failure the account is deleted again.
- Email verification is informational (never blocks); the app re-checks on focus and writes `verified:true` to the member record.

## 5. Status
- **Stage 1** (foundation, themes, snow, music) and **Stage 2** (landing page, scene, blizzard, lite performance work): done and verified on devices.
- **Stage 3** done except cleanup (3.5): Firebase project + rules + seed script; auth + groups plumbing; register/join/login/forgot pages with snowmen; verified-email sync;
  dashboard (phase cards, wishlist, rules, members, invite, verify banner); lite mode; global sounds; Christmas background; the latest dashboard redesign.
- The latest zip (`stage-3.4-redesign`) delivered: `App.jsx` without `Home`/`foundation-test`, `BackLink` hover, symmetrical "Join another group" button, solid bubble-style cards with
  waves and hover/tap reactions, Christmas rules card, wrapped wishlist, full `PROJECT-MAP.md`, this handover. **He has not yet tested it.**

## 6. Pending work
**Stage 3.5 (QA + cleanup)**: (a) bundle size: main JS is ~773 kB (250 kB gzip): split vendor chunks, lazy-load pages other than the landing page, load Firestore only when needed;
(b) browser autofill colours on dark palettes; (c) delete `src/pages/Home.jsx` (safe once the new `App.jsx` is applied), remove `framer-motion` from package.json if unused (check imports first),
tidy README; (d) Rules Playground checklist and a pass on every page on S20/iPhone; (e) consider adding the test setup (vitest) to the repo.
**Stage 4 (admin + groups)**:
- Create-group flow: on the join-code step add "No code? Create your own group": account first, then group form (name, tag, year, slug availability = doc id free), default rules text,
  generated join code; creator becomes owner. Cap of ~3 groups per account. **Open decision**: do it with a Netlify Function using the Admin SDK (recommended: enforces the cap and the
  FCFS slug) or by loosening rules. Replaces the seed script (keep the script for emergencies).
- Admin page `/g/:slug/admin`: stage control (forward/back with confirmation; decide what rolling back from `drawn` does to results), deadlines editor, rules editor (with preview),
  members table (nickname, real name, verified tick, role), promote/demote (owner), remove member (must also delete memberPrivate, nickname reservation, wishlist, and the person's
  stale `users.groups` entry; needs a function or an Admin-SDK path), join-code regenerate/deactivate, "request admin" flow (new `adminRequests` docs + rules).
- Landing "create group" entry and any rules changes must be republished in the Console.
**Stage 5 (preferences)**: `/g/:slug/preferences` (currently a "coming soon" placeholder): pick giftee/gifter preferences, mutual-pick odds, opt-out, owner-only `picks/{uid}`.
**Stage 6 (draw + emails)**: Netlify Function (Admin SDK) verifies the caller is an admin of the group, runs the weighted draw, writes `results/{uid}`, sets stage `drawn`; phase-change emails
(provider TBD, e.g. Resend/Brevo); WhatsApp `wa.me` share button; giftee's wishlist card on the dashboard (needs results).
**Stage 7 (reveal)**: `/g/:slug/reveal` placeholder exists; 1-2 lightweight reveals, replayable, gifting-day sequencing (see section 3).

## 7. Things learned (avoid repeating mistakes)
- **React 19 + eslint-plugin-react-hooks 7** is strict: no synchronous `setState` in effects (`set-state-in-effect`), no reading refs in render or in handlers wrapped by `contextSafe` (use
  `event.currentTarget`), exhaustive-deps; keep contexts, hooks and components in separate files (react-refresh). The scratch workflow below lints against the repo's exact config.
- **GSAP + SVG**: an element GSAP animates must not have its own `transform` attribute (put positioning on a parent `<g>`). Tailwind v4 `translate-*`/`scale-*` use the CSS `translate`/`scale`
  properties, so they coexist with GSAP's `transform`.
- **Firestore**: a listener that gets a permission error ends permanently (hence the retry logic). Rules allow ~20 document lookups per batch; the join batch uses ~9. A doc created in a batch can be
  checked with `existsAfter/getAfter`. `serverTimestamp()` fields must equal `request.time` in the rules.
- **Netlify** secrets scanning can fail builds because `VITE_*` values appear in the bundle: set `SECRETS_SCAN_OMIT_KEYS`.
- Layout: `svh`, hidden scrollbar, `overflow-clip`; the `short:` variant means landscape phones (max-height 500px). The desktop auth pages break out of the 80% content width with
  `md:ml-[calc(50%-50vw)] md:w-screen`.
- Palette-aware UI must not use fixed text colours except inside self-contained cards (error cards, bubbles, dashboard cards use their own fixed colours and override the CSS variables).

## 8. Waiting on the user (unreported test notes)
He said he would test and report: the 3.3 notes batch (show/hide password icon preference, lite-mode landing, doodles, phone steps, snowmen layout on login, poke bubble placement), the 3.3d/3.4 fixes
(stale error fix, "Curia VI" title, card look), and the latest redesign (buttons' hover, solid bubble cards, rules card, wrapped wishlist, card reactions). He also wants the
lowest cloud on phones toward the left in lite mode (done for lite; the animated version drifts). Treat his next message as test feedback.

## 9. Durable facts to file in memory (first turn)
- Secret Santa site is multi-group (separate friend groups run concurrently); landing label shows the group name when signed in; Stage 3 (auth, groups, dashboard) built with Firebase Auth + Firestore, Netlify hosting.
- Per-group roles owner/admin/member; creator = owner; stages registration > preferences > awaiting_draw > drawn; deadlines are display-only; real names only to admins and the person.
- Registration: real name, nickname (unique per group), email + confirm email (non-gating verification email), password + confirm; phones get a 3-step form; password reset yes.
- Dashboard: solid bubble-style coloured cards with waves and doodles, hover/tap reaction with cooldown, Christmas rules card, wishlist (10 items + hints) that becomes a wrapped present after the draw.
- Lite mode (static, no animations) for weak phones; sound effects on every page with a separate mute; Christmas doodle background on non-landing pages.
- Stage 7: limit reveals to 1-2 and redesign for performance. Stage 4 plan: create-group flow at the code step, admin page, join-code management, request-admin flow.
- Working style: detailed steps, plan then wait for "go", zip deliveries, he applies changes himself; never tell him to delete a file that is still imported.

## 10. How the previous thread verified things (to reproduce)
In the sandbox: copy the repo's files into a scratch project, install the repo's ESLint stack and run `npx eslint src`; vitest + jsdom + Testing Library with mocked `firebase/firestore`
for logic (membership listener race, verified sync, phase tags, wishlist/rules helpers, edition label, lite switch); Playwright Chromium (`python3 -m playwright install chromium`) with a Vite
harness page and an in-memory fake `firebase/firestore` (alias in a separate Vite config) to look at register/login/dashboard at desktop, phone and landscape sizes. The sandbox resets
between turns, so rebuild it each time. Real Firebase and real devices are only ever tested by the user.
