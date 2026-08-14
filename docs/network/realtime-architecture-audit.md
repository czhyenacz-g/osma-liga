# Realtime multiplayer network architecture audit

Date: 2026-08-14
Scope: `osma-liga` (Next.js frontend, Vercel) + `project-hub-api` (Fastify + Socket.IO backend, Hetzner VPS)
Type: read-only architecture audit + minimal WS RTT diagnostic (dev/debug only, no gameplay change)

## 1. Verdict (one sentence)

The architecture is already correctly split — the browser connects **directly** to the Hetzner Socket.IO server for all realtime gameplay (movement, kick, bench deploy, snapshots), Vercel only proxies pre-match REST calls (join/create/auth) and serves the static app, so any perceived "latency" is not caused by an unnecessary Vercel hop and should be diagnosed via tick/snapshot rate and interpolation, not hosting topology.

## 2. Exact realtime path

| Step | Path | Vercel in the loop? |
|---|---|---|
| Load `/hra/online/[code]` | browser → Vercel (Next.js SSR/static) | Yes (expected — page delivery only) |
| Create/join game | browser → **Vercel `/api/online-games*` route handler** → Hetzner `https://api.osmaliga.cz/api/osma-liga/online-games/...` (server-side `fetch`, `X-Project-Hub-Key` header) → Postgres | Yes, but control-plane only |
| Token/session | Vercel route handler reads `getSession()` (own cookie session) and forwards `userId`/`userName` to Hetzner on join; Hetzner issues `hostToken`/`guestToken` per game room, returned to the browser via the Vercel JSON response | Yes, but control-plane only |
| WebSocket connect | **browser → Hetzner directly** (`io(process.env.NEXT_PUBLIC_PROJECT_HUB_WS_URL)`, `wss://api.osmaliga.cz`, `path: /socket.io/`) | **No** |
| `join_game` (send token) | browser → Hetzner (WS) | No |
| Movement/kick input | browser → Hetzner (WS event `input`, ~30 Hz client send) | No |
| Bench deploy | browser → Hetzner (WS event `deploy_bench_player`) | No |
| Game tick | Hetzner only (server-internal, `tickGame()`) | N/A |
| Snapshot/update | Hetzner → browser (WS event `state`) | No |
| Reconnect | browser re-runs `io(WS_URL)` + `join_game` directly against Hetzner; no Vercel involvement | No |

`NEXT_PUBLIC_*` env vars are inlined into the client bundle at build time, so the WS connection literally never touches a Vercel server — it's a browser-to-Hetzner TCP/TLS connection from the start.

**Is the WebSocket at match time browser → Hetzner directly? YES.**

## 3. WebSocket endpoint

- Client construction: `osma-liga/components/online/useOnlineGame.ts:48-52`
  ```ts
  const WS_URL = process.env.NEXT_PUBLIC_PROJECT_HUB_WS_URL ?? 'http://localhost:3001';
  const socket = io(WS_URL, { path: '/socket.io/', transports: ['websocket', 'polling'] });
  ```
- Production value: `.env.example:14` → `NEXT_PUBLIC_PROJECT_HUB_WS_URL=https://api.osmaliga.cz`
- Dev fallback: `http://localhost:3001`
- No rewrite/proxy exists anywhere in `osma-liga` (`next.config.ts` only sets `output: "standalone"` + `outputFileTracingRoot`; no `vercel.json`/`vercel.ts`; `middleware.ts` only does an EU-geo redirect on `/satna` and `/hra/*`, it does not rewrite or proxy).
- Server: `project-hub-api/src/ws/onlineGameSocket.ts` — Socket.IO `Server` attached directly to the Fastify/Node `http.Server`, same `path: '/socket.io/'`, CORS restricted to `config.corsOrigins`.

## 4. REST/API path split

**Control plane (Vercel route handlers → Hetzner REST, all under `osma-liga/app/api/*`):**
`online-games` (create/join/looking-for-opponent), `tournaments` (create/start/claim/play), `match-results`, `training-challenges/active`, `auth/*` (login/callback/logout/me). Each handler does a server-side `fetch(process.env.PROJECT_HUB_API_URL + ...)` with header `X-Project-Hub-Key`. Example: `app/api/online-games/[code]/join/route.ts:28`.

**Realtime/data plane (browser → Hetzner WS only, never HTTP):**
`join_game`, `start_game`, `input` (movement/kick/switch), `deploy_bench_player` — all handled exclusively in `project-hub-api/src/ws/onlineGameSocket.ts`. No realtime action was found accidentally routed through HTTP/Vercel.

## 5. Vercel proxy/rewrites check

Checked `next.config.ts`, `middleware.ts`, and searched for `vercel.json`/`vercel.ts` — none exist. No rewrite or proxy of any kind sits in front of the Hetzner WS or REST endpoints. Vercel's only role is (a) serving the Next.js app itself and (b) acting as a same-origin REST proxy for pre-match control-plane calls (join/create/tournament/auth), which also lets it forward the app's own session cookie and hide `PROJECT_HUB_API_KEY` from the browser.

## 6. WS RTT diagnostic (added)

No ping/pong or RTT diagnostic previously existed (Socket.IO's own transport heartbeat is not exposed to app code). A minimal, additive, debug-gated probe was added:

- **Server** — `project-hub-api/src/ws/onlineGameSocket.ts`: `socket.on('debug_ping', ts => socket.emit('debug_pong', ts))`. Stateless echo, does not touch room/game state, requires no auth (harmless if a stray client calls it — it never reads or mutates game state).
- **Client** — `osma-liga/components/online/useOnlineGame.ts`: enabled only when the page URL has `?wsdebug=1`. Sends `debug_ping` with `Date.now()` every 2s, computes `Date.now() - echoedTimestamp` on `debug_pong`, exposes it as `rttMs` from the hook.
- **UI** — `osma-liga/components/online/OnlineGameClient.tsx`: renders a small `WS RTT: Nms` label top-right during play, only when `rttMs !== null` (i.e. only when `?wsdebug=1` was present).

To measure: open a live match at `/hra/online/<code>?wsdebug=1` and read the on-screen value. This is the real network RTT, not a snapshot-interval proxy.

No production behavior changed — the flag defaults off, and when off, no extra socket events are emitted and no extra state updates occur.

## 7. Tick rate / snapshot rate

- **Server tick**: `project-hub-api/src/modules/osmaLiga/onlineGames.ts` — `TICK_MS = 33` → **~30 Hz (33 ms)**.
- **Snapshot broadcast**: `TICKS_PER_SNAPSHOT = 2` → snapshot sent every 2nd tick → **~15 Hz (66 ms)**.
- **Client input send**: `OnlineGameClient.tsx` — `setInterval(..., 33)` → **~30 Hz**, merged keyboard+touch state sent as `input` events.
- **Client render/interpolation**: `OnlineGameCanvas.tsx` — per-`requestAnimationFrame` lerp (`LERP = 0.3`) of rendered position toward the last received snapshot. This runs at display refresh rate (typically 60 Hz), independent of the 15 Hz snapshot rate.

At 15 Hz snapshots with a 0.3 lerp factor, a step change in a remote player's true position takes several frames to visually converge — this is a deliberate smoothing tradeoff, and a likely source of perceived "sluggishness" that has nothing to do with hosting.

## 8. Server authority / client prediction

- **Fully server-authoritative**: ball, all player positions, kicks, goals, score, bench timer — computed once in `tickGame()` inside `project-hub-api/src/gameEngine/*`, shared engine code (this matches the recent "unify players onto a parametric Player + PlayerStats model" refactor visible in `osma-liga`'s own `game/` directory, which mirrors the server engine 1:1 for the offline bot-test mode).
- **No client-side prediction.** The client does not simulate movement locally and reconcile; it purely renders the last server snapshot with a visual-only interpolation lerp (`OnlineGameCanvas.tsx`). A comment in that file explicitly notes the kick-charge ring is "visual-only... doesn't touch the server-authoritative kick force."
- **Practical effect**: all gameplay-affecting latency the player *feels* is: input send delay (browser→Hetzner) + one tick to be applied + up to one snapshot interval to be broadcast + one animation frame to render. There is no local-prediction masking of network RTT, so RTT and snapshot rate both matter directly to perceived responsiveness.

## 9. Region / server

- Hetzner VPS: `178.104.20.225`, hostname `ubuntu-4gb-nbg1-1-zasobovani-plus` (per `project-hub-api/docs/hetzner-initial-inventory.md` and `docs/deployment.md`). Hetzner's `nbg1` naming convention denotes Nuremberg, but no document in either repo explicitly labels a "region" field — datacenter location is inferred from the hostname, not confirmed by an explicit config value.
- Production hostname used by the client: `api.osmaliga.cz`, reverse-proxied by nginx on the VPS to `127.0.0.1:3001` (port bound to localhost only per `docker-compose.yml`), TLS via certbot.

## 10. Vercel workload today

Vercel handles: Next.js SSR/static rendering of all league/club/profile/lobby pages, all `/api/*` route handlers (control-plane REST proxy + session/auth), image optimization, and (per project context) analytics/CDN/firewall. It does **not** run any part of the game simulation, tick loop, or realtime transport. Moving the whole app to the VPS would relocate this REST-proxy and page-rendering work onto the same box that also runs the authoritative game loop, without removing any hop from the realtime path (which already skips Vercel).

## 11. Security notes on the direct WS endpoint

- WS endpoint is public on the open internet (`wss://api.osmaliga.cz`), not proxied through Vercel's firewall/CDN/BotID — this is expected given the direct-connection design, but it does mean any WAF/bot-mitigation Vercel provides does not cover this attack surface.
- No `io.use()` connection-level auth middleware; authentication is per-event inside `join_game`, comparing a client-supplied `playerToken` against tokens issued at game-creation/join time. Reasonable for this app's threat model (short-lived per-match tokens), but it does mean any socket can connect and send `join_game`/`debug_ping` before authenticating.
- No rate limiting or connection-count limiting found (no `@fastify/rate-limit`, no per-IP connection cap) — a flood of connections or `input`/`debug_ping` events is not throttled at the app layer.
- No message schema validation library (zod/etc.); `input` handler manually coerces each field to boolean, `deploy_bench_player` only checks `typeof playerId === 'string'`. Sufficient for the current small message set but has no systematic guard against malformed/oversized payloads.
- CORS on the Socket.IO server is restricted to `config.corsOrigins` (env-configured), which is a real (if weak, since `Origin` headers are client-supplied) mitigation against unrelated third-party sites opening sockets.

These are pre-existing conditions of the direct-WS design, not something introduced by the Vercel/Hetzner split — flagged for awareness only, not fixed here.

## 12. Recommendation

**KEEP CURRENT ARCHITECTURE.**

The Vercel/Hetzner split is not adding a realtime hop; the browser already talks directly to Hetzner for gameplay. Migrating the frontend to the VPS would not reduce gameplay latency and would give up Vercel's CDN/analytics/firewall for no realtime benefit.

If perceived latency remains a problem, ranked by benefit/risk:

1. **Raise snapshot rate to match tick rate (30 Hz instead of 15 Hz)** — change `TICKS_PER_SNAPSHOT` from 2 to 1 in `project-hub-api/src/modules/osmaLiga/onlineGames.ts`. Low risk (pure constant change), doubles update frequency, directly targets the most likely source of "unresponsive" feel identified in §7. Costs roughly 2x outbound WS bandwidth per room — worth checking against current VPS bandwidth headroom before flipping.
2. **Tune or make the client interpolation lerp factor adaptive** (`OnlineGameCanvas.tsx`, `LERP = 0.3`) — e.g. a higher lerp or a small linear-extrapolation buffer would reduce visible catch-up lag between snapshots, independent of network conditions. Low risk, client-only change.
3. **Add lightweight per-socket rate limiting** on `input`/`debug_ping` (e.g. a max-events-per-second guard) — addresses the §11 gap without touching gameplay logic. Slightly higher risk/effort than 1–2 since it touches the connection handler for every event type; recommend only if abuse is actually observed.

Do not pursue infra migration as a latency fix — it targets the wrong bottleneck given the findings above.

## 13. Changed files

- `project-hub-api/src/ws/onlineGameSocket.ts` — added stateless `debug_ping`/`debug_pong` echo handler.
- `osma-liga/components/online/useOnlineGame.ts` — added debug-gated (`?wsdebug=1`) RTT probe, exposes `rttMs`.
- `osma-liga/components/online/OnlineGameClient.tsx` — renders `rttMs` as a small overlay when present.
- `osma-liga/docs/network/realtime-architecture-audit.md` — this document.

No database migration, no hosting change, no change to production default behavior (diagnostic is opt-in via query param).

## 14. Validation

- `osma-liga`: `tsc --noEmit` clean, `next lint` clean (no warnings/errors), `next build` succeeded (all routes compiled, including `/hra/online/[code]`).
- `project-hub-api`: `tsc --noEmit` clean, `npm run build` (`tsc`) succeeded. `vitest run` has 11 pre-existing failing test files due to no local Postgres on `localhost:5433` (unrelated to this change — no test touches `onlineGameSocket.ts`); 235 tests passed, 196 skipped (require DB).

## 15. Commit

See git log — committed to `main` after validation, prefixed `docs: add realtime architecture audit + debug WS RTT probe`.
