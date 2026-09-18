# Stage 8A — Testing the barcode scanner on a real phone

Developer notes for the camera-scanner spike. The scanner (native
`BarcodeDetector` with a ZXing fallback) requires a **browser camera
permission**, and browsers only grant that in a **secure context**.

## Why plain `http://<LAN-IP>:3000` will not work

`navigator.mediaDevices.getUserMedia` (and the `BarcodeDetector` API) are
only exposed in secure contexts:

- `https://…` — secure ✅
- `http://localhost:3000` — treated as secure by Chrome/Safari ✅
  (but "localhost" means *the phone itself*, not your dev machine)
- `http://172.18.0.1:3000` (or any LAN IP over plain HTTP) — **not** a
  secure context ❌. `navigator.mediaDevices` is `undefined` there, and
  the scanner will show
  «Сканирование не поддерживается этим браузером».

This is a browser security rule, not an app bug. Do not bypass it.

## Option 1 — the sandbox preview URL (zero setup)

The Arena preview of this workspace is served over HTTPS
(`https://<port>-<sandbox>.e2b.app`), which is already a secure context.
Opening that URL on a phone gives a working camera scanner with **no
local setup at all**.

## Option 2 — Android over USB: `adb reverse` (no certificates)

The simplest fully-local option, because `localhost` is a secure context:

```bash
# on the computer running the dev server
adb reverse tcp:3000 tcp:3000
npm run dev -- -H 0.0.0.0 -p 3000
```

Then open **`http://localhost:3000`** in Chrome on the phone (USB
debugging enabled). Traffic is tunneled through USB to your machine.

## Option 3 — LAN over HTTPS with the built-in Next.js flag

Next.js 15 (verified: `next dev --help`) can serve the dev server over
HTTPS with a self-signed certificate:

```bash
npx next dev --experimental-https -H 0.0.0.0 -p 3000
# → https://<your-LAN-IP>:3000
```

On Android Chrome, accept the "certificate is not trusted" warning for
this dev server (settings → advanced → proceed). This is a **dev-only**
self-signed certificate — never ship or trust it in production.

## Option 4 — mkcert: a locally-trusted CA (best for iOS Safari)

iOS Safari is pickier about self-signed certificates, and it needs the
scanner anyway (no native `BarcodeDetector` there — the ZXing fallback
engine is used):

```bash
brew install mkcert   # or: apt/scoop/choco equivalents
mkcert -install       # installs the local CA into your system trust store
mkcert 192.168.1.20   # your dev machine's LAN IP → cert + key

npx next dev --experimental-https \
  --experimental-https-key ./192.168.1.20-key.pem \
  --experimental-https-cert ./192.168.1.20.pem \
  -H 0.0.0.0 -p 3000
```

For iOS, the mkcert root CA must also be trusted on the phone (AirDrop
the root CA file from `mkcert -CAROOT`, install it via Settings →
Profile Downloaded, then enable full trust in Settings → General →
About → Certificate Trust Settings).

## What is explicitly NOT done

- No `chrome://flags/#unsafely-treat-insecure-origin-as-secure` — it
  disables browser security for the whole browser.
- No permanent certificate exceptions, no production certificates, no
  deployment changes.
- The app never requests the camera before the user presses
  «Сканировать штрихкод», and the button only exists on touch-primary
  devices, so desktop sessions are never asked for camera access.

## Browser support summary (as of writing)

| Browser | Engine used |
| --- | --- |
| Chrome on Android | native `BarcodeDetector` |
| Samsung Internet, Chrome/Edge desktop (macOS/ChromeOS) | native `BarcodeDetector` |
| Firefox (desktop/Android) | ZXing fallback |
| Safari / iOS Safari | ZXing fallback |
| Chrome desktop on Linux/Windows | ZXing fallback (no native API there) |

The engine is chosen at runtime by `createBarcodeEngine()`; a failed
native detector construction also falls back to ZXing.
