# 数字生命 · Life Mint

A small Chinese digital-life companion. The phone app is Expo (SDK 57) and talks to a local API that keeps each life in memory. Without an API key, the life still answers in its own voice from a template, and it can store facts and a diary.

The app and the API are two packages in this repo. They are not npm workspaces, so Metro stays a normal Expo project.

## 1. Start the API

From the repo root, on a computer:

```bash
cd server && npm i && npm run dev
```

The API listens on **port 8787** and on all interfaces (`0.0.0.0`), so a phone on the same Wi-Fi can reach it. Memory lives in the process: restarting the server clears lives, facts, and diary.

Check it:

```bash
curl -s localhost:8787/health
```

## 2. Start Expo

In another terminal, from the repo root:

```bash
npm i && npx expo start
```

A QR code appears in the terminal. Install **Expo Go** on the phone and scan that code. This project is Expo SDK 57 so the Expo Go app currently on the App Store and Play Store can open it.

The phone does not run these commands. A computer runs them. The phone only scans.

## 3. Point the phone at the computer

On a real phone, `127.0.0.1` is the phone itself, not your computer. In the app’s create screen or **设置**, set the API address to the computer’s LAN address, for example:

```text
http://192.168.1.8:8787
```

Phone and computer need the same Wi-Fi. Include `http://` and the port. The dev server already binds `0.0.0.0`, so you do not change the listen address. If the phone cannot connect, allow port 8787 through the computer’s firewall.

Find the computer’s address:

- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I`
- Windows: `ipconfig` and read the IPv4 address

`http://127.0.0.1:8787` is only for a browser or emulator on the same computer.

## 手机用户（不需要终端，也不需要 DSH）

手机上不要装终端，不要打开 DSH，也不要跑任何命令。只做这几件事：

1. 在应用商店安装 **Expo Go**。
2. 请用电脑的人在这个项目里启动 API 和 Expo（上面第 1、2 步）。电脑屏幕上会出现一个二维码。
3. 手机打开 Expo Go，扫描二维码。应用会在手机里打开。
4. 手机和电脑连同一个 Wi-Fi。在「唤醒」或「设置」里，把服务地址改成电脑的局域网 IP，例如 `http://192.168.1.8:8787`。不要填 `127.0.0.1`，那是手机自己。
5. 起一个名字，选一张脸，点「唤醒」，就可以聊天。头像会一直留在对话页上方。

电脑上的人如何查看 IP：macOS 终端执行 `ipconfig getifaddr en0`，Linux 执行 `hostname -I`，Windows 在命令提示符执行 `ipconfig`，看 IPv4。

## In the app

- **唤醒** picks a preset face and a name, relationship, voice, and traits, then `POST /lives` and saves the life on the phone.
- **对话** keeps the avatar on screen and sends each turn to `POST /lives/:id/chat`.
- **形象** previews the presets and switches the face stored on this phone.
- **设置** edits the API address, reads facts and diary, adds a fact, and clears memory.

Say “请记住……” in chat and the API files that sentence as a fact, unless it touches a taboo listed in `memoryPolicy.forget`.

`memoryPolicy.decayDays` is stored (default 30) and is not applied yet. Restarting the API drops the in-memory store.

## API

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/health` | | `{ ok: true }` |
| `POST` | `/lives` | `{ name, persona?, avatarUrl, memoryPolicy?, opening? }` | `LifePack` |
| `GET` | `/lives/:id` | | `LifePack` |
| `POST` | `/lives/:id/chat` | `{ message }` | `{ reply }` |
| `GET` | `/lives/:id/memory` | | `{ facts, diary }` |
| `POST` | `/lives/:id/memory/facts` | `{ text }` | the new fact |
| `DELETE` | `/lives/:id/memory` | | `{ facts: [], diary: [] }` |

`POST /lives` fills `persona.systemPrompt` and `opening` when you omit them. CORS is open so Expo Go can call the API.

Example:

```bash
curl -s -X POST localhost:8787/lives \
  -H 'content-type: application/json' \
  -d '{"name":"林间","avatarUrl":"https://example.com/lin.png","persona":{"relationship":"朋友","voice":"温和，慢慢说","traits":["耐心"]}}'
```

Use the returned `id`:

```bash
curl -s -X POST localhost:8787/lives/ID/chat \
  -H 'content-type: application/json' \
  -d '{"message":"今天有点安静"}'
```

### Optional model

If `server/.env` contains `OPENAI_API_KEY`, chat calls that chat-completions API (`OPENAI_BASE_URL`, `OPENAI_MODEL`). Copy `server/.env.example`. With no key, or if the call fails, the template voice is used. Do not commit `.env`.

## Layout

```text
app/                     Expo Router screens
src/types/life-pack.ts   LifePack type
src/api/                 client for the API
src/state/               on-phone store
src/components/
assets/avatars/          preset face list
server/                  Express API
```

## Checks

```bash
npm run typecheck
npm run lint
cd server && npm test && npm run typecheck
```

Node.js 22.13 or newer.
