# Project map: everything in the project, where it lives, what it does

Secret Santa site (React + Vite + Tailwind + GSAP + Firebase, deployed on Netlify). Paths are inside `src/` unless they start
with `/` (repo root). Each entry says what the file does and **one example of what you might change there**.
Files marked *(Stage 1/2)* came from the earlier landing-page stages; the rest were added or changed in Stage 3.

## Quick lookup: "I want to change..."

| I want to change... | Go to |
|---|---|
| What the snowmen say, and the trolling (lines are drawn "marble bag" style: no repeats until all are used) | `components/auth/snowmen/lines.js` |
| The small "Secret Santa" title above the register/login cards | `components/auth/TitleMark.jsx` |
| The freeze-and-melt page transition (speed, look) | `lib/frost.js` (timing), `components/FrostWipe.jsx` (look) |
| Which page changes skip the transition | `components/Layout.jsx` (`AUTH_PAGES`) |
| How long a field error stays | `components/auth/Field.jsx` (`ERROR_MS`) |
| Dashboard card colours / waves | `components/dashboard/colors.js` |
| The corner doodles on dashboard cards | `components/dashboard/Scribbles.jsx` |
| How dashboard cards react to hover/tap | `components/dashboard/useCardFx.js` |
| What the phase cards say | `pages/Dashboard.jsx` (the `description=` lines) |
| Which tag a phase shows at each stage | `components/dashboard/phases.js` |
| The Christmas background on non-landing pages | `components/ChristmasDoodles.jsx` |
| Landing text and buttons | `components/landing/HeroContent.jsx` |
| Landing scene colours / shapes | `components/landing/sceneArt.js` |
| Landing entrance animation | `components/landing/useLandingTimeline.js` |
| Parallax strength | `lib/useParallax.js` (`PARALLAX_AMOUNT`) |
| What lite mode switches off | `lib/lite.js` (comment), `lite.css`, `isLite()` checks |
| Colour palettes | `theme/palettes.js` |
| Music list | `audio/tracks.js` + files in `/public/audio` |
| UI sounds | `audio/sfx.js` (the sounds), `audio/useGlobalSfx.js` (when they play) |
| Bottom-right buttons | `components/Dock.jsx` |
| Registration steps on phones | `components/auth/RegisterDetails.jsx` (`STEPS`) |
| Wishlist limits | `lib/wishlist.js` |
| Who can read/write what in the database | `/firestore.rules` |
| Rules text a new group starts with | `/scripts/seed-group.mjs` (`DEFAULT_RULES`) |
| Page routes | `App.jsx` |

---

## Repo root

- `index.html`: the page shell. Paints the saved background colour before React loads (so there's no white flash) and sets the browser-bar colour. *Example:* if you change a palette's canvas colour, update its first-paint colour table here.
- `package.json`, `package-lock.json`: dependencies (React 19, Vite 7, Tailwind 4, GSAP, react-router 7, firebase, howler; `firebase-admin` is dev-only for the seed script). *Example:* `npm run dev` / `build` / `lint` live in `scripts` here.
- `vite.config.js`: Vite + React + Tailwind plugins. `eslint.config.js`: lint rules (strict React hooks rules).
- `.gitignore`: ignores env files, `node_modules`, `dist` and service-account keys. `.gitattributes`: line endings.
- `.env.local` *(yours, never committed)*: your six `VITE_*` Firebase values. `.env.example`: the same names, empty, to copy from.
- `README.md`: project notes. `docs/PROJECT-MAP.md`: this file. `docs/HANDOVER-stage-4.md`: the context handover for a new chat.
- `/firestore.rules`: the database security rules (see the Firebase section).
- `/scripts/seed-group.mjs`: creates a group from your computer (see the Firebase section).
- `/public/_redirects`: tells Netlify to serve `index.html` for every path, so `/dashboard` works on reload.
- `/public/audio/*.mp3`: the 11 Christmas tracks. `/public/fonts/Striper-Regular.woff2` (+ `FFL.txt` licence): the title font. `/public/vite.svg`: default icon.

## Core wiring

- `main.jsx`: starts the app. Provider order matters: Router > Theme > Music > Auth > Group > App. Loads `index.css`, `lite.css`, the lite switch, and the performance monitor.
- `App.jsx`: the route map: `/` landing, `/register`, `/login`, `/forgot`, `/join`, `/dashboard`, `/g/:slug/dashboard`, placeholders `/g/:slug/preferences` and `/reveal`. *Example:* add Stage 4's admin page as a new `<Route path="admin" ...>` inside `g/:slug`.
- `firebase.js`: starts Firebase (Auth + Firestore) from the `VITE_*` variables; warns in the console if one is missing.
- `index.css` *(Stage 1/2, extended)*: Tailwind v4 setup, the colour tokens (`canvas`, `surface`, `primary`, `accent`, `ink`, `muted`, `snow`), the `short:` landscape variant, safe-area helpers, the big-button styles (`.cta*`), clouds/sun animation, scrollbar hiding. *Example:* the button look is under `.cta`.
- `lite.css`: styles that apply only in lite mode.

## Theme and colours (`theme/`) *(Stage 1)*

- `palettes.js`: the 7 colour palettes (all dark except Snowy Woodland; "Christmas At Grace" has a red canvas). *Example:* tweak a colour or add a palette.
- `variants.js`: makes the day and night version of each palette. `colorMath.js`, `contrast.js`: colour maths and the dev-only contrast warnings.
- `ThemeProvider.jsx`, `themeContext.js`, `useTheme.js`: apply the palette to the page, remember the choice, follow the device's light/dark setting, and animate day/night switches (instant in lite mode).

## Accounts (`auth/`)

- `authContext.js`, `useAuth.js`: who is signed in: `useAuth()` gives `user`, `status` (`loading`/`signedIn`/`signedOut`), `signIn`, `logOut`, `resetPassword`, `refreshUser`.
- `AuthProvider.jsx`: the provider; also re-checks email verification when the tab gains focus (at most every 15 s). *Example:* change `15000`.

## Groups (`groups/`)

- `groupContext.js`, `useGroup.js`: `useGroup()` gives `groups`, `activeGid`, `group`, `me` (nickname/role), `stage`, `isAdmin`, `isOwner`, `loading`.
- `GroupProvider.jsx`: works out your groups and the active one (URL, then last used), keeps them live, retries while a brand-new membership reaches the server, records `verified` on your member record. *Example:* retry count (`attempt < 6`).
- `useMembers.js`: live list of a group's members. `useRules.js`: live rules text.

## Route guards (`routes/`)

- `RequireAuth.jsx` (signed-out go to `/login`), `RedirectIfAuthed.jsx` (signed-in skip `/login`, `/forgot`), `RequireGroup.jsx` (only members enter `/g/:slug/...`), `DashboardRedirect.jsx` (`/dashboard` goes to your last group), `RouteLoading.jsx` (the snowflake while checking).

## Pages (`pages/`)

- `Landing.jsx`: full animated landing page and the lite (static) one; Enter goes to the dashboard when signed in.
- `Register.jsx` / `Join.jsx`: join code, then details (new account / existing account). `Login.jsx`, `ForgotPassword.jsx`.
- `Dashboard.jsx`: the member dashboard (header, buttons, verify banner, three phase cards, wishlist, rules, members, invite).
- `ComingSoon.jsx`, `GroupComingSoon.jsx`: "built in the next step" placeholders (preferences, reveal).
- `Home.jsx` *(Stage 1)*: old test page for palette tokens. **Not used by any route any more**; safe to delete.

## Helpers (`lib/`)

- `authErrors.js`: Firebase error codes to friendly sentences. *Example:* reword "That email and password don't match".
- `emailTypos.js`: the "Did you mean gmail.com?" hint, email validation and masking. *Example:* add a provider to `DOMAINS`.
- `groupCache.js`: remembers the last group name so the landing label shows instantly. `groupTitle.js`: "Curia" + "VI" = "Curia VI".
- `lite.js`, `useLite.js`: lite mode (static, no animations), saved on the device; `?lite=1` / `?lite=0` in a link sets it.
- `nickname.js`: nickname rules and the uniqueness key. *Example:* `NICKNAME_MAX`.
- `registration.js`: everything that writes people into Firestore (code lookup, nickname check, create account + join, join another group). *Example:* `CODE_LENGTH`.
- `rulesText.js`: turns the rules text into safe blocks (paragraphs, numbered lines, **bold**). `wishlist.js`: wishlist limits and tidying. *Example:* `MAX_ITEMS`.
- `useMediaQuery.js`: "is the screen narrower than X?" for React.
- `useParallax.js`: the landing scene's depth effect. *Example:* `PARALLAX_AMOUNT = 0` turns it off.
- `frost.js`: the freeze-and-melt page transition used for every page change except those leaving the landing page and those among the register/join/login/forgot pages (`playFrost`).
- `blizzard.js` *(Stage 2)*: the snowstorm page transition from the landing page (`playBlizzard`, `consumeArrival`). `storm.js` *(Stage 2)*: the storm strength shared by snow and parallax.
- `perf.js` *(Stage 2)*: measures real frame rate and lowers visual quality on weak devices (`?fps` shows the meter). `dustBus.js` *(Stage 2)*: lets any component puff snow dust at a point.
- `motion.js` *(Stage 1)*: `prefersReducedMotion()`. `gsap.js` *(Stage 1)*: registers GSAP and `useGSAP`. `useButtonFx.js` *(Stage 2)*: the big buttons' magnet, press, sparkle and drop-fill effects. `useScrollLock.js` *(Stage 1)*: stops the page scrolling behind an open sheet.

## Sound (`audio/`)

- `sfx.js` *(Stage 2)*: the short sound effects, synthesised in the browser (no files): `sfx.tick`, `pop`, `chime`, `thump`, `hop`, `wish`, `door`... plus the wind loop and the mute switch. `useSfx.js`: React view of the mute state.
- `useGlobalSfx.js`: plays a tick on buttons/links and rising notes when you focus form fields, on every page. *Example:* swap `sfx.tick()` for `sfx.pop()`.
- `tracks.js`: the music list (title, file). `MusicProvider.jsx`, `musicContext.js`, `useMusic.js`: the music player (play/pause/next, remembered choice). *Example:* add a track here and drop the mp3 in `/public/audio`.

## Layout and global components (`components/`)

- `Layout.jsx`: the shell around every page: glow, snow, door sound on page change, the page transition (freeze-and-melt frost; a plain 0.25 s fade in lite mode; none after the landing blizzard or among `/register`, `/join`, `/login`, `/forgot`: see `AUTH_PAGES`), the Christmas doodles on non-landing pages, lite-mode removals, dock.
- `ChristmasDoodles.jsx`: the faint Christmas pattern behind non-landing pages. *Example:* `OPACITY`; add a doodle to `TILE`.
- `BackLink.jsx`: the "back" pill with the sliding-fill hover.
- `Dock.jsx`: bottom-right buttons, top to bottom: lite, music, palette (a button in use is filled). `Sheet.jsx`: the sliding panel they open. `MusicPanel.jsx`: the music sheet (tracks, volume, sound-effects switch). `PalettePanel.jsx`: the palette sheet (palettes, day/night). `Icons.jsx`: icon components.
- `SnowCanvas.jsx` *(Stage 1/2)*: the falling snow (amount follows the performance tier). `DustTrail.jsx`: snow dust following the pointer. `CursorFlake.jsx`: the rotating-snowflake cursor on desktop. `Blizzard.jsx`: the whiteout overlay of the landing page's transition. `FrostWipe.jsx`: the frost overlay of every other page transition (animated by `lib/frost.js`). `PerfHud.jsx`: the fps meter (`?fps`).
- `DevStageSwitcher.jsx`: developer-only buttons to jump a group between stages (only under `npm run dev`, for admins).

## Landing page (`components/landing/`) *(Stage 2, with Stage 3 edits)*

- `HeroContent.jsx`: title, buttons, the group label, the quiet lite link. `useEdition.js`: what the "Curia VI / 2026 Edition" label shows.
- `Scene.jsx`, `sceneArt.js`: the night-village backdrop (sky, stars, moon/sun, clouds, hills, cottage) and its drawing data. `FairyLights.jsx`, `lightsGeometry.js`: the string lights.
- `SkyToggle.jsx`: the sun/moon day-night switch. `useDayNightScene.js`: dims the night glow in day mode.
- `useLandingTimeline.js`: the entrance animation and idle loops. `useTapReactions.js`: little reactions when you tap lights, title letters, cottage, pines. `Santa.jsx`, `useSanta.js`: Santa's sleigh crossing the sky every 30-40 s.

## Register / login parts (`components/auth/`)

- `AuthShell.jsx`: the page frame used by register, join, login and forgot-password: snowmen half on the LEFT + form half on the right on desktop (always, no per-page option), one snowman over the card on phones, the Back link, the small "Secret Santa" `TitleMark`, and the snowmen's speech logic. *Example:* `SPOTS` (bubble positions).
- `TitleMark.jsx`: the landing page's "Secret Santa" title (same Striper font and outline, `.hero-title` in `index.css`) in small size. *Example:* change its sizes in the `className`.
- `Field.jsx`: one labelled input with its error/hint and the error lifetime rules (`ERROR_MS`). `ErrorNote.jsx`: the red error card. `PasswordField.jsx`: password input with Show/Hide. `AuthButton.jsx`: the big button with the landing page's effects.
- `CodeStep.jsx`: the join-code step (*example:* edit `REASONS`). `RegisterDetails.jsx`: the registration form; on phones it comes in `STEPS` (*example:* `COMMON_PASSWORDS`). `JoinDetails.jsx`: real name + nickname for joining another group.
- `DoneCard.jsx`, `ClosedCard.jsx`, `GroupBadge.jsx`: success screen, "registration closed" screen, the "Curia VI" label. `useNicknameCheck.js`: live nickname availability (*example:* `SPECIAL`). `stageContext.js`, `useStage.js`: how fields talk to the snowmen.
- `snowmen/`: `lines.js` (**everything they say**: `LINES`, `ESCALATE`, `LINE_GAP`; `pickLine` draws from a per-event marble bag, so every line is said once before any repeats and then the bag is reshuffled), `Snowman.jsx` (the drawing), `SnowmanScene.jsx` (desktop trio, always on the left: `SNOWMEN`), `PeekingSnowman.jsx` (phone), `Bubble.jsx` (bubble look), `gazeStore.js` + `useSnowmanGaze.js` (where they look; `PUPIL_TRAVEL`).

## Dashboard (`components/dashboard/`)

- `colors.js`: **each card's colours** (`CARDS`) and the bubble outline colour. *Example:* `registration: { bg: "#1f7a47", wave: "#f2fff6" ... }`.
- `Card.jsx`: the card frame (solid colour, charcoal bubble outline, tail, wavy bottom strip, corner doodles). `Wave.jsx`: the wavy strip. `Scribbles.jsx`: the corner doodles per card kind (`OPACITY`). `useCardFx.js`: the hover/tap reaction (`COOLDOWN_MS`, `GLYPHS`).
- `PhaseCard.jsx` + `phases.js` (tags and date wording) + `Tag.jsx` (status pill colours) + `icons.jsx` (phase icons).
- `WishlistCard.jsx`: the wishlist editor; after the draw it becomes a wrapped present. `RulesCard.jsx`: the Christmas rulebook (candy-cane frame, ribbon, baubles). `MembersCard.jsx`: nickname chips. `InviteCard.jsx`: join code, copy link, WhatsApp. `VerifyBanner.jsx`: the "verify your email" banner.

---

# Firebase: what is set up and where

## In the Firebase Console (project you created in Stage 3.1)
- **Authentication**: Email/Password sign-in enabled. *Authorized domains* include `localhost` and your Netlify domain (add any new domain here, or password-reset/verification links and sign-in will refuse it). *Templates* tab: sender name/subject of the verification and reset emails.
- **Firestore Database**: production mode, the region you picked. **Rules** tab holds the contents of `/firestore.rules` (paste it there and Publish after every change).
- **Project settings > Service accounts**: the private key used only by `/scripts/seed-group.mjs`. Keep it outside the repo.
- **Project settings > General**: the web app's config, copied into `.env.local` and Netlify.

## Netlify
Site configuration > Environment variables: the six `VITE_*` values. If a build fails with a "secrets scanning" error, add `SECRETS_SCAN_OMIT_KEYS` listing those six names (Firebase web config is public by design). After changing variables, redeploy.

## Data model (Firestore)
```
users/{uid}                          email, createdAt, lastGroup, groups[]          (only that person)
joinCodes/{CODE}                     gid, active, createdAt                         (anyone can get one by exact code; nobody can list)
groups/{gid}                         name, tag, year, stage, deadlines{registration,preferences,gifting}, createdBy, createdAt   (anyone reads; admins update)
groups/{gid}/content/rules           text, updatedAt, updatedBy                     (members read; admins write)
groups/{gid}/members/{uid}           nickname, nicknameKey, role(owner|admin|member), joinedAt, verified, joinCode   (members read)
groups/{gid}/memberPrivate/{uid}     realName                                       (that person + admins)
groups/{gid}/nicknames/{key}         uid                                            (unique nicknames per group; anyone can get by exact key)
groups/{gid}/wishlists/{uid}         items[], hints, updatedAt                      (owner until the draw; later their gifter reads it; admins can't)
(later) groups/{gid}/picks/{uid}, groups/{gid}/results/{uid}
```
`gid` is the group's URL slug, e.g. `curia-vi`. **Stages** (`groups/{gid}.stage`): `registration` > `preferences` > `awaiting_draw` > `drawn`.

## `/firestore.rules` in plain words
- Anyone can read a group's public doc and look up a join code or nickname *by exact name* (needed to register); nobody can list them.
- Joining is one atomic batch (member + private name + nickname reservation, plus the user doc) allowed only while the stage is `registration`, with a valid active join code, a unique nickname, and role `member`.
- Members read member lists and rules; real names only to the person and admins. Admins change stage/deadlines/name, edit rules, remove members; the owner promotes/demotes.
- A member can set only their own `verified` to true; wishlists are owner-only and locked at `drawn`.
- Everything else is denied (including `picks` and `results` until Stage 5/6).

## Common Firebase tasks
- **Change a group's stage** (until the admin page exists): Console > Firestore > `groups` > your group > edit `stage`, or use the dev switcher under `npm run dev`.
- **Set deadlines**: in the same document add/edit `deadlines.registration`, `deadlines.preferences`, `deadlines.gifting` as *timestamp* fields.
- **Edit the rules text**: `groups/<id>/content/rules` > `text`.
- **Create a group**: `node scripts/seed-group.mjs --key <service-account.json> --email <owner email> --id <slug> --name <name> --tag <tag> --year <year> --real-name "..." --nickname ...` (the owner's account must already exist in Authentication).
- **Make someone an admin**: `groups/<id>/members/<uid>` > `role` = `admin` (the Console bypasses the rules).
- **See who registered**: Authentication > Users (accounts) and `groups/<id>/members` (nicknames).
