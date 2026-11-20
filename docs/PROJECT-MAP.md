# Project map: where things are and what you can change

Everything added in Stage 3 (accounts, groups, register/login, dashboard, snowmen, lite mode), by folder. Each line says
what the file does and **one example of something you might change there**. Paths are inside `src/` unless noted.
Stage 1 and 2 files (palettes, music, snow, the landing scene, blizzard, sounds in `audio/sfx.js`) are unchanged
except where listed under "Landing page".

## Quick lookup: "I want to change..."

| I want to change... | Go to |
|---|---|
| The snowmen's jokes, tips and trolling | `components/auth/snowmen/lines.js` |
| How long an error stays on screen | `components/auth/Field.jsx` (`ERROR_MS`) |
| The colour of a dashboard card | `components/dashboard/colors.js` |
| The doodles on the dashboard cards | `components/dashboard/Scribbles.jsx` |
| What the phase cards say | `pages/Dashboard.jsx` (the `description=` lines) |
| The Christmas background pattern on other pages | `components/ChristmasDoodles.jsx` |
| How much the landing scene moves (parallax) | `lib/useParallax.js` (`PARALLAX_AMOUNT`) |
| What lite mode switches off | `lib/lite.js` (comment), `lite.css`, and the `isLite()` checks |
| The sounds on buttons and fields | `audio/useGlobalSfx.js` |
| The order/look of the bottom-right buttons | `components/Dock.jsx` |
| Registration steps on phones | `components/auth/RegisterDetails.jsx` (`STEPS`) |
| Who can do what in the database | `firestore.rules` (repo root) |
| The default rules text for a new group | `scripts/seed-group.mjs` (`DEFAULT_RULES`) |

## Repo root

- `firestore.rules`: the security rules (who can read/write what). Paste into Firebase Console > Firestore > Rules > Publish.
  *Example:* change `<= 10` in the wishlist rule to allow 15 items (and `MAX_ITEMS` in `lib/wishlist.js`).
- `scripts/seed-group.mjs`: creates a group + owner + join code from your computer (needs a service-account key kept outside the repo).
  *Example:* edit `DEFAULT_RULES` to change the rules text every newly seeded group starts with.
- `.env.example`: the names of the six `VITE_*` Firebase variables to copy into `.env.local` and Netlify.
- `.gitignore`: also ignores env files and service-account keys.
- `docs/PROJECT-MAP.md`: this file.

## Core wiring

- `firebase.js`: starts Firebase (Auth + Firestore) from the `VITE_*` variables and warns clearly in the console if one is missing.
- `main.jsx`: starts the app. Provider order matters: Router > Theme > Music > Auth > Group. Also loads `lite.css` and the lite-mode switch before first paint.
- `App.jsx`: the route map (`/`, `/register`, `/login`, `/forgot`, `/join`, `/dashboard`, `/g/:slug/dashboard`, placeholders for `/preferences` and `/reveal`).
  *Example:* add the Stage 4 admin page as one more `<Route path="admin" ...>` inside `g/:slug`.

## Accounts (`auth/`)

- `authContext.js`, `useAuth.js`: the shared "who is signed in" value, and the hook `useAuth()` giving `user`, `status` (`loading` / `signedIn` / `signedOut`), `signIn`, `logOut`, `resetPassword`, `refreshUser`.
- `AuthProvider.jsx`: the provider behind it. Also re-checks "did they verify their email?" when the tab gains focus (at most every 15 seconds).
  *Example:* change `15000` to check less often.

## Groups (`groups/`)

- `groupContext.js`, `useGroup.js`: the shared group info and the hook `useGroup()` giving `groups`, `activeGid`, `group`, `me` (your nickname/role), `stage`, `isAdmin`, `isOwner`, `loading`.
- `GroupProvider.jsx`: works out your groups and the active one (URL, then last used), keeps them live, retries while a brand-new membership reaches the server, and records `verified` on your member record.
  *Example:* change the retry count (`attempt < 6`) or delay (`400 *`).
- `useMembers.js`: live list of a group's members (nicknames/roles, no real names). Used by the "Who's in" card.
- `useRules.js`: live rules text of a group. Used by the "The rules" card.

## Route guards (`routes/`)

- `RequireAuth.jsx`: signed-out visitors go to `/login` and come back afterwards.
- `RedirectIfAuthed.jsx`: signed-in visitors skip `/login` and `/forgot`.
- `RequireGroup.jsx`: only members get into `/g/:slug/...`; others see "You're not in this group" or "Group not found".
- `DashboardRedirect.jsx`: `/dashboard` sends you to your last-used group (or `/join` if you have none).
- `RouteLoading.jsx`: the little snowflake shown while checking who you are.

## Helpers (`lib/`)

- `authErrors.js`: turns Firebase error codes into friendly sentences. *Example:* reword "That email and password don't match".
- `emailTypos.js`: the "Did you mean gmail.com?" hint and email masking. *Example:* add a provider to `DOMAINS`.
- `groupCache.js`: remembers the last group name on the device so the landing label appears instantly.
- `groupTitle.js`: joins a group's name and tag into "Curia VI" for sentences and buttons.
- `lite.js`, `useLite.js`: lite mode (static, no animations). On/off switch, saved on the device; `?lite=1` / `?lite=0` in a link also sets it.
- `nickname.js`: nickname rules and the uniqueness key. *Example:* change `NICKNAME_MAX`.
- `registration.js`: everything that writes people into Firestore (join-code lookup, nickname check, create account + join, join another group). *Example:* `CODE_LENGTH` if you change the join-code length.
- `rulesText.js`: turns the rules text into safe blocks (paragraphs, numbered lines, **bold**).
- `useMediaQuery.js`: "is the screen narrower than X?" for React. Used by the phone steps.
- `useParallax.js` (changed): the landing scene's depth effect. *Example:* `PARALLAX_AMOUNT = 0` turns it off, `0.3` is the minute drift, `1` is the original strength.
- `wishlist.js`: wishlist limits (`MAX_ITEMS`, `MAX_HINTS`) and tidying.

## Sound (`audio/`)

- `useGlobalSfx.js`: soft tick on buttons/links, rising notes when you focus form fields, on every page. *Example:* swap `sfx.tick()` for `sfx.pop()`.

## Layout, background, dock (`components/`)

- `Layout.jsx` (changed): the shell around every page: glow, snow, page fade, door sound on page change, the Christmas doodles on non-landing pages, and the lite-mode removals.
- `ChristmasDoodles.jsx`: the faint Christmas pattern behind non-landing pages. *Example:* `OPACITY` for strength; add or move a doodle in the `TILE` list.
- `Dock.jsx` (changed): bottom-right buttons, top to bottom: lite, music, palette. A button in use is filled. *Example:* reorder the three `<div className="dock-btn">` blocks.
- `DevStageSwitcher.jsx`: developer-only buttons to jump a group between stages (shown only under `npm run dev`, for admins).

## Landing page (`pages/Landing.jsx`, `components/landing/`)

- `pages/Landing.jsx` (changed): full landing page and the lite landing page; Enter goes to the dashboard when signed in.
- `landing/HeroContent.jsx` (changed): title, buttons, the group label (filled in when signed in), and the quiet lite link.
  *Example:* change the link text "Phone slow? Try the lite version".
- `landing/useEdition.js`: decides what the "Curia VI / 2026 Edition" label shows.
- `landing/Scene.jsx` (changed): the backdrop; day/night swap is instant in lite mode.
- `landing/useDayNightScene.js` (changed): dims the night glow in day mode (instantly in lite).
- `theme/ThemeProvider.jsx` (changed): no reveal animation when switching day/night in lite mode.
- `lite.css`: CSS that only applies in lite mode (stops clouds, sun, and so on).

## Register / login pages and their parts

Pages (`pages/`):
- `Register.jsx`: join code, then the details form. `Join.jsx`: same for someone already signed in. `Login.jsx`, `ForgotPassword.jsx`.
- `ComingSoon.jsx`, `GroupComingSoon.jsx`: "built in the next step" placeholders (preferences, reveal).
- `Dashboard.jsx`: see below.

Parts (`components/auth/`):
- `AuthShell.jsx`: the page frame: form half + snowmen half on desktop, one snowman over the card on phones, the "Back" link, and the snowmen's speech logic. *Example:* `SPOTS` (where each bubble sits), `STAGE_VARS` (snowman body colours).
- `Field.jsx`: one labelled input with its error/hint, and the error lifetime rules. *Example:* `ERROR_MS` = how long a field error stays.
- `ErrorNote.jsx`: the red error card. `PasswordField.jsx`: password input with Show/Hide. `AuthButton.jsx`: the big button with the landing-page effects.
- `CodeStep.jsx`: the join-code step. *Example:* edit `REASONS` (the messages for a wrong code).
- `RegisterDetails.jsx`: the full registration form; on phones it comes in `STEPS`. *Example:* change step titles or move a field to another step; `COMMON_PASSWORDS` is what the snowmen scold.
- `JoinDetails.jsx`: real name + nickname for joining another group.
- `DoneCard.jsx`, `ClosedCard.jsx`, `GroupBadge.jsx`: the success screen, the "registration is closed" screen, the "Curia VI" label.
- `useNicknameCheck.js`: live "is this nickname free?" check. *Example:* `SPECIAL` = nicknames that make a snowman comment.
- `stageContext.js`, `useStage.js`: how fields talk to the snowmen.

Snowmen (`components/auth/snowmen/`):
- `lines.js`: **everything they say.** `LINES` (add a joke to any list), `ESCALATE` (trolling after N repeats: e.g. 3 wrong codes), `LINE_GAP` (cooldowns).
- `Snowman.jsx`: the drawing (head, scarf, hats, arms). *Example:* change a hat shape in `Hat`.
- `SnowmanScene.jsx`: the desktop group. *Example:* `SNOWMEN` = positions, sizes, hats and scarf colours of the three; the group mirrors when the form is on the left.
- `PeekingSnowman.jsx`: the phone's single snowman over the card.
- `Bubble.jsx`: the speech bubble look (`INK` colour, background).
- `gazeStore.js`, `useSnowmanGaze.js`: where they look (mouse, then the field you're typing in; away when a password is visible). *Example:* `PUPIL_TRAVEL` = how far the pupils move.

## Dashboard (`pages/Dashboard.jsx`, `components/dashboard/`)

- `pages/Dashboard.jsx`: the whole page: header, buttons, verify banner, three phase cards, wishlist, rules, members, invite. *Example:* change a phase card's `description=` text, or reorder the cards.
- `colors.js`: **one colour per card.** *Example:* `registration: "#2f9e5b"` to `"#1d8348"`.
- `Scribbles.jsx`: the hand-drawn doodles per card kind (`trees`, `hearts`, `gifts`, `list`, `paper`, `faces`, `envelope`) and the wavy title underline. *Example:* `OPACITY` to make them louder.
- `Card.jsx`: the card frame (tint = card colour mixed into the palette's canvas colour: change the `34%`).
- `PhaseCard.jsx`: one phase card (tag, text, date, button).
- `phases.js`: which tag each phase shows for each stage, and the date wording. *Example:* rename "Locked" to "Not yet".
- `Tag.jsx`: the coloured status pills (`TONES`). `icons.jsx`: the three phase icons.
- `WishlistCard.jsx`: the wishlist editor (limits in `lib/wishlist.js`). `RulesCard.jsx`: the rules. `MembersCard.jsx`: the nickname chips. `InviteCard.jsx`: join code, copy link, WhatsApp. `VerifyBanner.jsx`: the "verify your email" banner.
