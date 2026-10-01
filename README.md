# Treasure Tide

A multiplayer pirate quiz built with React, Vite, Zustand, Express and Socket.IO. The existing game engine and ocean presentation are preserved. Teams now join from phones using private QR codes and answer in real time.

## Run

Requires Node.js 22.12+ (developed with Node 24).

```sh
npm install
npm run dev:all
```

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

Open the **Network** URL printed by Vite, followed by `/admin`. Use the address of the Wi-Fi adapter shared with your phones, not a virtual adapter. Vite binds to all interfaces. No IP address is hardcoded.

Separate terminals also work: `npm run server` and `npm run dev -- --host`. Socket.IO is proxied through Vite, so phones only need the frontend port (normally 5173).

### Recovering Admin and configuring QR links

Open **http://localhost:5173/admin** for Admin and **http://localhost:5173/game** for
the projector (open Admin first, or use its game screen link with `?gameId=...`).
The LAN equivalents are `http://<your-LAN-IP>:5173/admin` and `/game`.
`/` keeps the existing harbor page with Admin and Game links. `/join/:joinToken`,
`/team/:joinToken`, and `/results` retain their existing purposes.

The observed "Team screen instead of Admin" was the shared network gate: Vite was
running on 5173, but the realtime backend on 3001 was unavailable. The URL remained
`/admin`; the gate replaced every route with a team-styled connection screen.
Admin now stays visible with inactive controls and a connection message until the
server connects. The harbor remains available even with an unavailable server or
stale remembered game. Route matching also accepts `/admin/` consistently with React
Router. There is no team-role redirect or persisted Zustand route in this version.

`.env.example` is a template, not a runtime configuration file. Create `.env` with
plain values (substitute the Wi-Fi IP if it changes):

```dotenv
VITE_PUBLIC_GAME_URL=http://172.16.54.12:5173
VITE_SOCKET_URL=
PORT=3001
GAME_STATE_FILE=server/data/games.json
```

Never wrap the URL in Markdown `[url](url)`. Invalid sharing values fall back to the
current browser origin instead of crashing the Admin QR cards. The public URL is
used only for QR/copy/join links; it never selects a route, socket endpoint or role.
Trailing slashes, paths, queries and fragments are removed from the sharing base.
Vite loads `.env` at startup; after editing it, stop the running development
process(es) with Ctrl+C and run `npm.cmd run dev:all` (or `npm run dev:all`). If Vite
is already running and only the backend is missing, run `npm.cmd run server` in
another terminal. Avoid starting a second Vite on a different port accidentally.

Browser storage belongs to each origin, so localhost and the LAN IP have separate
host credentials. App-owned localStorage keys are:

- `treasure-tide:host:v2`: host secret and game ID; retain this to keep host access.
- `treasure-tide:watch:v2`: last host/projector game ID; team tabs no longer write it.
- `treasure-tide:language:v1`: English/Georgian preference.

The app writes no sessionStorage keys and persists no global role, team ID, join
token or last route. Team refresh restores identity only from the explicit URL.
For development, clear a stale remembered spectator game from the browser console:

```js
const { resetLocalSession } = await import('/src/services/localSession.js');
resetLocalSession();
```

Then open `/admin` or the host's current projector link. This helper removes only
`treasure-tide:watch:v2` from localStorage/sessionStorage; it preserves host access,
language, server game data and all unrelated browser storage.

## Play a voyage

1. Open `/admin`. Add teams with 2–6 crew and add four-choice questions. In development, **Load demo game** supplies four teams with six crew and ten questions.
2. Open **Game screen** in another tab or window for your projector.
3. Scan each team's QR on a phone. Confirm **Join as [team]**. The phone opens `/team/:joinToken`. For tab testing, use **Open Team Screen**. Each crew shares one answer interface.
4. Click **Start game → Show question**. Submit answers from team tabs.
5. Click **Lock answers → Reveal correct answer → Process round**. Missing answers count as wrong.
6. After the presentation ends, click **Next question → Show question**. Continue until questions end or every ship finishes or sinks.

Pause stops answer submission and pauses presentation timing. Resume continues the same round. Reset/restart clears scores and answers while preserving the roster and quiz. Create new game replaces the entire setup. Destructive actions have confirmation dialogs.

The `/` harbor page shows the fleet without exposing private team links. `/results?gameId=...` shows final standings. The admin’s **Open game screen** link includes the game ID so the projector can use a different browser or computer.

Team cards show connection and answer status, ship color, crew, QR, copyable URL and regeneration controls. Click a QR or **Show Large QR** for a large display. Regenerating a code immediately revokes the old link and existing team sessions. Reset preserves codes. Replacing the roster expires removed teams’ codes.

After a phone submits, all four choices remain visible and disabled, with its selected answer marked. The result appears above them after reveal, followed by the authoritative remaining crew count. Between rounds, active teams see a waiting message. These controls and messages use the existing English/Georgian catalogs.

## Rules and deliberate defaults

- Correct: advance one point, retain all crew.
- Wrong or no answer: remain in place, lose exactly one pirate.
- One pirate can continue. Zero crew eliminates the ship.
- Race distance is question count × correct-answer movement. With the default one-point movement and no bonus rounds, reaching the island requires every answer to be correct. Other survivors can still place when the quiz ends.
- Island arrivals rank ahead of other ships: earlier arrival first, then more remaining crew.
- Ships that have not arrived rank by survival, progress, then crew. Eliminated ships follow surviving ships. Exact ties share a competition rank (1, 1, 3).
- Eliminated teams appear in final standings but receive no podium trophy. If all ships sink, the sea wins.
- There is no hard team limit. The ocean displays six ships per fleet group, scales ships with team count, and rotates groups every 12 seconds. Arrows switch groups manually.

Gameplay settings live in `src/data/defaultGameSettings.js`. Current approved rules remain the default. Ship locations are derived from normalized logical progress; animation callbacks never modify gameplay outcomes.

## Phone setup and network configuration

1. Connect the host computer and phone to the same Wi-Fi.
2. Run `npm run dev:all` and open Vite's **Network** URL on the computer, then `/admin`.
3. Load the demo or add teams and questions. The demo crews are Black Sharks, Sea Wolves, Red Kraken and Golden Pirates.
4. Scan Black Sharks' QR, confirm the team, and check that its card says **Connected**.
5. Open the public game screen; start and show a question. Tap B on the phone. The admin should show **ANSWERED**, while the public screen shows only a count.
6. Lock, reveal and process. A correct answer moves one point with unchanged crew; a wrong/missing answer loses exactly one crew and does not move.
7. Refresh the phone: its current answer remains submitted. Disconnect/reconnect Wi-Fi: it rejoins automatically without changing crew.

`getTeamJoinUrl(joinToken)` in `src/config/networkConfig.js` uses `VITE_PUBLIC_GAME_URL` when set, otherwise `window.location.origin`. **No QR is rendered for localhost, loopback or 0.0.0.0.** For a host who wants to keep using localhost, copy `.env.example` to `.env`, set `VITE_PUBLIC_GAME_URL` to the actual Network URL, and restart Vite. Every QR and copyable link uses the same helper.

`VITE_SOCKET_URL` defaults to the current page origin. Leave it blank when using the Vite proxy or the combined production server. Set it only for a separately hosted backend. `PORT` defaults to 3001. Allow the frontend port through Windows Firewall on your private network if needed. Guest Wi-Fi/client isolation may prevent devices from reaching one another. Prefer the Wi-Fi adapter over VirtualBox/Hyper-V addresses when Vite prints several Network URLs.

Clipboard API is used on HTTPS/localhost. An HTTP LAN fallback supports copying where that API is unavailable.

## Authority, persistence and reconnection

The Node server runs the existing pure reducer once per accepted command. The host controls setup, questions, locks, reveals and rounds. Server timers complete presentation even if the host tab closes. Phones only submit an answer as their authenticated team. Commands received while disconnected are not queued for later replay.

Each game uses a separate `game:{gameId}` Socket.IO room. Each host has a random secret; the server stores its hash. Team join tokens contain 192 random bits. Client-supplied game/team IDs never grant host or other-team privileges. Both duplicate and stale answers are rejected, including after refresh. Finished or eliminated teams can reconnect to a read-only view.

Only hosts receive the question bank and join tokens. Public/team snapshots contain the current question and options, with no `correctAnswerId` until reveal, no future question text, and no other teams' selected answers. The same filtering covers rankings and paused phases. Demo answer keys live under `server/`, which Vite is configured not to serve.

Game state is saved on the server in `server/data/games.json` (override with `GAME_STATE_FILE`), including answers and hashed host credentials. Server restart reloads games and recovers overdue round presentations. This is a single-process development server, not a horizontally scaled service. Do not run multiple server processes against the same file.

The browser stores only its host credential and last viewed game ID. Keep the host's browser storage to retain control; switching frontend origins creates a separate browser credential. The earlier localStorage-only prototype save is left untouched, but is not imported automatically. Public and team routes never use the stored host credential to authenticate.

## Production

Build with `npm run build`. Set `NODE_ENV=production`, `FRONTEND_ORIGIN=https://your-game-domain`, and `VITE_PUBLIC_GAME_URL` before building. Run `npm start`: Express serves `dist`, client route fallbacks and Socket.IO together. Put it behind HTTPS with WebSocket forwarding. Production refuses to start without `FRONTEND_ORIGIN`; only exact configured browser origins are accepted. Development permits localhost and private IPv4 origins. CORS is not authentication: host/team credentials are validated separately.

The demo loader is disabled in production. New host rooms can be created by opening Admin, suitable for this initial multiplayer implementation; accounts, room quotas and a shared database are outside this version.

## Architecture

```text
src/
  app/              App and route composition
  components/
    admin/          Setup, team/question editors, controls, live status
    common/         Buttons, dialogs, icons, audio controls
    game/           SVG world, ships, pirates, question/reveal, podium
    team/           Mobile answer interface
  config/           Central public URL and socket configuration
  data/             Central gameplay settings
  network/          Shared socket event names
  logic/            Pure game reducer, round, movement and ranking rules
  services/         Socket.IO transport and audio manager
  store/            Zustand state and command interface
  styles/           Shared, admin and game styles
  utils/            IDs and validation
server/
  index.js          HTTP, Socket.IO, origin policy and production hosting
  gameRooms.js      Credentials, room state, persistence and safe snapshots
  socketHandlers.js Authorization, subscriptions, commands and round timers
  demoGame.js       Development-only teams and question bank
tests/
  gameEngine.test.js Pure rule and transition tests
  realtime.test.js   Real socket clients, privacy and authorization tests
  e2e/              Browser gameplay, editing, concurrency and layout tests
```

The scene uses original procedural SVG art and CSS animations for reliable 2.5D rendering without WebGL requirements. Fonts are bundled locally. The app needs no remote art or font server. Audio is opt-in, with synthesized effects and master/music/effects controls; ambience and soundtrack assets are intentionally not included. The audio manager provides a future track registration hook. This is not an offline-installable PWA.

## Verify and build

```sh
npm test
npm run lint
npm run test:e2e
npm run build
npm run preview
```

Browser tests use locally installed Microsoft Edge and write screenshots to `artifacts/`. If Edge is unavailable, install Playwright Chromium (`npx playwright install chromium`) and remove `channel: 'msedge'` from `playwright.config.js`. Production output is `dist/`; the provided production server handles client route fallbacks. Browser tests start isolated services on ports 5175 and 3002 and prefer the computer’s Wi-Fi IPv4 address for the LAN scenario.

Engine coverage includes crew boundaries, correct/wrong/missing answers, duplicate and stale answers, elimination, phase guards, pause/resume, ties, 1/3/12/30-question voyages, 100-team setup, restart, early end and serialized recovery. Browser coverage exercises actual editors, two-team full gameplay, six simultaneous submissions, shared arrival ties, reload, sinking, pagination, mobile answer layout and invalid routes.

Realtime coverage includes cross-game isolation, host impersonation, answer-key redaction, duplicate/stale/invalid/late submissions, code revocation, reconnection, persistence and server-driven presentation completion. Browser coverage also uses independent host, mobile and projector contexts over a LAN address, tests QR display/copy/join, offline recovery, and checks that server-only source cannot be downloaded. A physical phone scan still needs manual verification.

## Implementation file map

- Added: `server/index.js`, `server/gameRooms.js`, `server/socketHandlers.js`, `src/config/networkConfig.js`, `src/network/socketEvents.js`, `src/services/SocketGameService.js`, `src/components/common/NetworkGate.jsx`, `src/components/common/NetworkStatus.jsx`, `src/components/admin/TeamJoinCard.jsx`, `src/components/team/TeamJoinScreen.jsx`, `src/styles/network.css`, `.env.example`, `tests/realtime.test.js`, `tests/e2e/multiplayer.spec.js`.
- Updated: `src/app/App.jsx`, `src/main.jsx`, `src/store/gameStore.js`, `src/utils/ids.js`, `src/components/Landing.jsx`, `src/components/admin/AdminPanel.jsx`, `src/components/admin/LiveTeamStatus.jsx`, `src/components/team/TeamAnswerScreen.jsx`, `src/components/game/GameScreen.jsx`, `vite.config.js`, `package.json`, `package-lock.json`, `.gitignore`, `playwright.config.js`, `tests/gameEngine.test.js`, `tests/e2e/game.spec.js`, `README.md`.
- Moved: `src/data/demoGame.js` to `server/demoGame.js`, with the requested demo crew names. Removed the superseded `src/services/LocalGameService.js` and browser timer hook `src/hooks/useRoundController.js`; their responsibilities now belong to the socket transport and server. The pure game rules engine is unchanged.
- Installed: `express`, `socket.io`, `socket.io-client`, `qrcode.react`; development dependency `concurrently`.

Protocol references: [Socket.IO rooms](https://socket.io/docs/v4/rooms/), [Socket.IO origin handling](https://socket.io/docs/v4/handling-cors/), [qrcode.react](https://github.com/zpao/qrcode.react).

## Question pictures and ocean animations

Questions now optionally contain `imageUrl` and `imageAlt`. In **Question chest → Add question / Edit**, upload, preview, replace or remove a picture and add a short image description. PNG, JPEG, WebP and GIF inputs up to 4 MB are decoded in the browser, reduced to at most 1280 pixels on the longest side, and saved as a still WebP (PNG fallback). The encoded picture is limited to 320 KiB before base64 expansion, keeping commands below the existing 500 KB socket limit. Temporary object URLs are revoked; only serializable strings reach persistence. The media contract also permits HTTPS URLs for a future file service. No cloud account is needed.

Pictures survive refresh and server restart and appear in the question bank, projector and team question view. Existing questions without pictures work as before. Public/team snapshots expose only the active picture, following the existing answer-key and future-question filtering.

Correct answers produce wind streaks for the 2.5-second sailing movement. Two small cartoon dolphins leap and splash on staggered 17/23-second cycles inside the ocean, behind the ships and away from the question panel. Effects use SVG/CSS, with no per-frame React updates or particle spawning.

Island arrivals get a 7.2-second presentation: sail to the dock, stagger the surviving crew down the gangway, gather beside the chest, open its lid, and reveal gold, glow and sparkles. Each visible lane has its own landing scene, so simultaneous arrivals retain their own crew count. Crew already lost never appear. The engine calculates progress, finish status and rankings before rendering; animation callbacks cannot change results. Ordinary rounds retain their existing duration. Pause freezes movement and effects; resume continues. Refreshing during a round seeks the presentation to its elapsed time. Reduced-motion preferences hide decorative dolphins/wind and show the settled arrival.

### Manual verification

1. Run `npm run dev:all` and open `/admin`. Add a team and a question with a picture; preview it, replace it, remove it, and save it again. Reload and edit to verify persistence. Try a non-image, corrupt image, or file larger than 4 MB for friendly validation. Create a second question without a picture.
2. Open the game screen and a team screen. Start and show each question; verify the image is contained without stretching on both desktop and phone, and that the question without a picture retains the normal layout.
3. For a quick finish, create a voyage with one question, choose the correct answer, then lock, reveal and process. Watch wind during movement, the crew cross the dock, and the chest open before the standings appear. Use several teams with different starting crews to compare simultaneous arrivals. Pause/resume partway through the sequence.
4. Leave the game screen open for 25 seconds to see both dolphin cycles. They stay behind the fleet and never cover the question controls. Enable the operating system's reduced-motion setting to check the calmer presentation.

The existing correct-only distance rule means a team must answer every question correctly to reach the island; there is no new gameplay shortcut for a depleted crew. Automated engine and browser fixtures additionally verify arrivals with one and three survivors, excluding eliminated crew.

### Files in this extension

Created:
- `src/utils/questionImage.js`, `src/components/admin/QuestionImageUpload.jsx`, `src/components/common/QuestionImage.jsx`, `src/styles/question-images.css`.
- `src/logic/presentationTiming.js`, `src/components/game/ShipLane.jsx`, `src/components/game/IslandFinishScene.jsx`, `src/components/game/TreasureChest.jsx`.
- `src/components/game/WindEffect.jsx`, `src/components/game/Dolphin.jsx`, `src/components/game/DolphinManager.jsx`, `src/styles/ocean-effects.css`.
- `tests/questionImages.test.js`, `tests/e2e/features.spec.js`.

Modified:
- `src/components/admin/QuestionEditor.jsx`, `src/components/admin/AdminPanel.jsx`, `src/components/game/QuestionOverlay.jsx`, `src/components/team/TeamAnswerScreen.jsx`.
- `src/utils/validation.js`, `server/gameRooms.js`, `src/logic/gameEngine.js`, `src/main.jsx`.
- `src/components/game/OceanScene.jsx`, `src/components/game/PirateShip.jsx`, `src/components/game/CrewMember.jsx`, `src/components/game/TreasureIsland.jsx`.
- `tests/gameEngine.test.js`, `tests/e2e/game.spec.js`, `README.md`.

Browser verification writes `artifacts/question-image-game.png`, `artifacts/question-image-phone.png` and `artifacts/island-arrival.png`. The animation fixture attaches sampled active frame intervals as a lightweight smoke check; this is not a hardware-wide FPS benchmark.
## English and Georgian interface

The app defaults to **ქართული**. The shared **EN / KA** switcher changes interface text immediately, without navigation or reloading. It appears in the admin toolbar (including setup/lobby), main game HUD, team answer and join headers, landing page, both results states, connecting/error screens, and editor/confirmation dialogs.

The preference is stored per browser/origin in `localStorage['treasure-tide:language:v1']`. Same-origin tabs synchronize through the storage event. Independent phones can choose their own language; a host's preference is never sent as a game command. Missing, invalid or inaccessible preferences fall back to Georgian, and blocked storage still allows switching for the current session. The document language and title update as well.

### Translation architecture

- `src/i18n/en.js` and `src/i18n/ka.js`: matching keyed catalogs for all built-in copy, including interpolation such as `t('common.crewCount', { count: 5 })`.
- `src/i18n/i18n.js`: pure translation, fallback, interpolation, canonical error translation and explicit question-content selection.
- `src/i18n/useTranslation.js`: an independent reactive language store plus `t`, `errorText`, `connectionText`, `gameName` and `content` helpers.
- `src/i18n/LanguageEffects.jsx`: document language/title, same-origin tab synchronization, and translated browser form-validation messages (including required radio groups).
- `src/components/common/LanguageSwitcher.jsx`: the reusable keyboard-accessible selector, with pressed-state semantics.
- `src/styles/i18n.css`: selector/responsive styling and the locally bundled Noto Sans Georgian variable font. Existing body/heading fonts fall back to it even when Georgian host content is shown with the English interface. No remote font request is needed during play.

The existing engine/server error protocol and language-neutral status values remain intact. Known errors are translated when displayed, so already-visible validation messages change language too. Unknown errors use a translated friendly fallback. Host-written names, questions, answers, descriptions, image captions and images are never passed through the interface dictionary. Newly generated default voyage names carry an explicit `nameKey`; saving a host name clears it. Existing saved names are not guessed or rewritten.

### Optional future question translations

Current string-based questions and answers are unchanged and no extra editor fields are required. A future editor can supply explicit metadata:

```js
{
  text: 'What is the capital of Georgia?',
  translations: { ka: { text: 'საქართველოს დედაქალაქი რომელია?' } },
  answers: [{
    id: 'answer-a', text: 'Tbilisi',
    translations: { ka: { text: 'თბილისი' } }
  }]
}
```

The content helper selects only explicitly authored metadata for the chosen language, otherwise falling back to the original string. Optional `imageAlt` translations also work. Validation accepts only supported locales and text fields; public/team snapshots whitelist them and continue to hide future questions and unrevealed answer keys. Answer IDs and scoring never depend on language. There is no automatic translation service.

### Coverage and verification

All existing screens and their built-in buttons, status/phase labels, dynamic crew/round/question counts, instructions, empty states, tooltips, accessible labels, dialogs, image feedback, connection messages, results and validation are localized. Host content and the English sample question bank deliberately retain their source text. Technical identifiers such as QR, Wi-Fi, URLs, game IDs, color codes and configuration variable names remain literal; the operating system's file-picker window uses its own language.

Run `npm test`, `npm run lint`, `npm run build` and `npm run test:e2e`. Existing English browser tests explicitly select English; the new bilingual tests start with the real Georgian default. They cover EN → KA switching without reload, stored preferences, edits that survive switching, Georgian team/question creation, required-field/radio validation, image-upload errors, shared-tab and independent-phone preferences, live questions, answer submission, finished rankings and empty/error screens. The font test checks Chromium's actual font usage for all 33 Georgian letters. Screenshots are written to `artifacts/georgian-admin.png`, `georgian-team.png`, `georgian-game.png` and `georgian-results.png`.

### Files in the bilingual extension

Created: `src/i18n/en.js`, `src/i18n/ka.js`, `src/i18n/i18n.js`, `src/i18n/useTranslation.js`, `src/i18n/LanguageEffects.jsx`, `src/components/common/LanguageSwitcher.jsx`, `src/styles/i18n.css`, `src/utils/questionTranslations.js`, `tests/i18n.test.js`, `tests/e2e/i18n.spec.js`.

Modified:
- App entry: `src/app/App.jsx`, `src/main.jsx`, `index.html`.
- Landing/admin: `src/components/Landing.jsx`, `admin/AdminPanel.jsx`, `admin/GameControls.jsx`, `admin/GameSetup.jsx`, `admin/LiveTeamStatus.jsx`, `admin/QuestionEditor.jsx`, `admin/QuestionImageUpload.jsx`, `admin/TeamEditor.jsx`, `admin/TeamJoinCard.jsx` (component paths under `src/components/`).
- Shared/team: `common/AudioControls.jsx`, `common/Modal.jsx`, `common/NetworkGate.jsx`, `common/NetworkStatus.jsx`, `common/QuestionImage.jsx`, `team/TeamAnswerScreen.jsx`, `team/TeamJoinScreen.jsx` (under `src/components/`).
- Game presentation: `game/FinishPodium.jsx`, `game/GameScreen.jsx`, `game/IslandFinishScene.jsx`, `game/OceanScene.jsx`, `game/PirateShip.jsx`, `game/QuestionOverlay.jsx`, `game/RankingPanel.jsx`, `game/ShipLane.jsx`, `game/TreasureIsland.jsx` (under `src/components/`).
- Model/persistence: `src/logic/gameEngine.js`, `src/utils/validation.js`, `server/gameRooms.js`.
- Fonts/styles: `src/styles/global.css`, `src/styles/admin.css`, `src/styles/game.css`, `package.json`, `package-lock.json`.
- Verification/docs: `tests/e2e/game.spec.js`, `tests/e2e/features.spec.js`, `tests/e2e/multiplayer.spec.js`, `README.md`.
