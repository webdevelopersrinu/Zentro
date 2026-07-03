# Chat Backend — Express + Socket.IO + Valkey adapter + MongoDB

Real-time chat backend. Designed to run on **2+ servers** that stay in sync via a
shared **Valkey** (Redis-compatible) server using the Socket.IO Valkey adapter.

## Folder structure

```
backend/
├── package.json
├── .env.example          # copy to .env
└── src/
    ├── server.js         # entry: wires API + Socket.IO + Valkey + Mongo
    ├── config/
    │   ├── db.js         # MongoDB connection
    │   └── valkey.js     # Socket.IO Valkey adapter (the multi-server glue)
    ├── models/           # User, Room, Message (Mongoose)
    ├── middleware/
    │   └── auth.js       # JWT guard for HTTP routes
    ├── routes/
    │   ├── auth.routes.js  # POST /signup, /login
    │   ├── user.routes.js  # GET /search (find usernames to invite)
    │   └── room.routes.js  # create / list / invite / message history
    ├── socket/
    │   └── index.js      # real-time: join, send, typing, presence
    └── utils/token.js    # JWT sign/verify
```

## Setup

```bash
cd backend
npm install
cp .env.example .env       # then edit values
```

You need **MongoDB** and **Valkey** running. For local dev:

```bash
# Valkey (or Redis) and Mongo via Docker, for example:
docker run -d -p 6379:6379 valkey/valkey
docker run -d -p 27017:27017 mongo
```

## Run ONE server

```bash
npm start          # listens on PORT (default 4000)
```

## Run TWO servers locally (to test the adapter)

Open two terminals — same Mongo, same Valkey, different ports:

```bash
# terminal 1
PORT=4000 npm start
# terminal 2
PORT=4001 npm start
```

Connect one client to `:4000` and another to `:4001`, join the same room, and
send a message. Both receive it — proving the Valkey adapter is syncing the two
servers. (On AWS, the Load Balancer hides the ports; both EC2s use 4000.)

## HTTP API (quick reference)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | – | Create account (unique username) |
| POST | `/api/auth/login` | – | Log in, get JWT |
| GET  | `/api/users/search?q=` | ✅ | Find usernames to invite |
| POST | `/api/rooms` | ✅ | Create a room (you become creator) |
| GET  | `/api/rooms` | ✅ | List your rooms |
| POST | `/api/rooms/:id/invite` | ✅ (creator) | Invite a user by username |
| GET  | `/api/rooms/:id/messages` | ✅ | Room message history |
| GET  | `/health` | – | Health check (shows pid) |

Send the token as `Authorization: Bearer <token>`.

## Socket.IO events

Client connects with the JWT: `io(url, { auth: { token } })`.

| Direction | Event | Payload |
|-----------|-------|---------|
| client → server | `room:join` | `roomId` (+ ack) |
| client → server | `room:leave` | `roomId` |
| client → server | `message:send` | `{ roomId, text }` (+ ack) |
| client → server | `typing` | `{ roomId, isTyping }` |
| server → client | `message:new` | `{ id, roomId, username, text, createdAt }` |
| server → client | `presence:joined` / `presence:left` | `{ username }` |
| server → client | `typing` | `{ username, isTyping }` |

## AWS deployment note

- Put **Valkey + MongoDB** on a private EC2 (or use ElastiCache + Atlas later).
- Run this app on **2 EC2 instances**, both pointing at the same `MONGO_URI` and
  `VALKEY_URL`.
- Front them with an **Application Load Balancer** with **sticky sessions ON**
  and WebSocket support. See `../BACKEND_ARCHITECTURE.md` for the full diagram.
