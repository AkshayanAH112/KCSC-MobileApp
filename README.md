# KCSC Mobile App — Kallar Central Sports Club

React + Vite SPA wrapped with Capacitor into an Android app, for running attendance and marks
on a phone at Kallar Central Sports Club's **free** tuition programme.

It ships **no backend of its own** — it talks to the
[KCSC web app's](https://github.com/AkshayanAH112/KCSC-WebApp) API over HTTP and authenticates
with an `Authorization: Bearer <token>` header (the token is stored via Capacitor Preferences).

There is no fee or payment surface anywhere in this app — classes are free.

## Screens

Dashboard · Students · Batches & Classes · **Scanner** (the primary daily task) · Marks ·
Today's Attendance

## Setup

```bash
npm install
cp .env .env.local   # or edit .env directly
npm run dev          # http://localhost:5173
```

Point `VITE_API_BASE_URL` at a running web app. It defaults to `http://localhost:3000`
(the web app's dev server) when unset, so start that first:

```bash
cd "../Web app" && npm run dev
```

## Commands

```bash
npm run dev          # vite dev server
npm run dev:lan      # bound to 0.0.0.0, for testing from a phone on the same Wi-Fi
npm run build        # tsc -b && vite build — this is the build AND the typecheck
npm run preview      # preview the production build
npm run cap:sync     # build + npx cap sync — copies web assets into android/
npm run cap:android  # cap:sync, then open the project in Android Studio
```

No test runner or lint script is configured.

### Testing on a real device

Set `VITE_API_BASE_URL` to this PC's LAN address, keep the phone on the same Wi-Fi, then:

```bash
npm run cap:sync
cd android && ./gradlew assembleDebug
```

### Regenerating app icons and splash screens

Sources live in `assets/` (`icon.png`, `splash.png`, `splash-dark.png`, all derived from the
club crest in `logo.png`):

```bash
npx @capacitor/assets generate --android \
  --iconBackgroundColor "#FDF8F6" --iconBackgroundColorDark "#180C0D" \
  --splashBackgroundColor "#720000" --splashBackgroundColorDark "#180C0D"
```

## Android identity

| | |
|---|---|
| Application ID | `lk.kcsc.admin` |
| App name | KCSC Admin |

## Design system

Maroon (`#720000`, sampled from the club crest) and gold. Tokens live in
[`src/index.css`](src/index.css).

**`Web app/app/globals.css` holds an independent copy of the same tokens — there is no shared
package, so any brand colour, radius, spacing, or font change must be applied to both files in
the same commit.** The rules behind them are in
`design-system/kallar-central-sports-club/MASTER.md`.

Fonts (Barlow + Barlow Condensed) are bundled via `@fontsource` rather than loaded from Google
Fonts, because Capacitor's WebView must work fully offline.
