# 💬 Zentro — What This Application Does

> A plan document. **No code.** This describes the product: what a user can do,
> how rooms work, and who is allowed to do what.

---

## 1. In one sentence

> **Zentro is a real-time chat app where you sign in with Google or GitHub,
> browse and join public rooms, and create private rooms that people can only
> enter with the creator's approval.**

---

## 2. The whole app in one picture

```
   ┌──────────┐
   │  Person  │
   └────┬─────┘
        │  1. Sign in with Google / GitHub
        ▼
   ┌─────────────────────────┐
   │   Profile created       │   name + photo + username
   │   👤 srinu-desetti      │   (taken from Google/GitHub)
   └────┬────────────────────┘
        │  2. Lands on the room list
        ▼
   ┌──────────────────────────────────────────────────────┐
   │                    ROOMS                             │
   │                                                      │
   │   🌐 PUBLIC ROOMS              🔒 PRIVATE ROOMS      │
   │   ───────────────              ───────────────       │
   │   Everyone can SEE             Only members SEE      │
   │   Everyone can JOIN            Must REQUEST to join  │
   │   Everyone can CHAT            Creator must APPROVE  │
   │                                                      │
   │   [ # general    Join ]        [ # team-secret       │
   │   [ # gaming     Join ]            Request to join ] │
   │   [ # study      Join ]                              │
   └──────────────────────────────────────────────────────┘
        │  3. Inside a room
        ▼
   ┌──────────────────────────────────────────────────────┐
   │  # general                            👥 12 members  │
   │  ──────────────────────────────────────────────────  │
   │   alice   10:02                                      │
   │   ┌───────────────────┐                              │
   │   │ Hey everyone! 👋  │                              │
   │   └───────────────────┘                              │
   │                              me   10:03              │
   │                        ┌──────────────────┐          │
   │                        │ Hi! welcome 🎉   │          │
   │                        └──────────────────┘          │
   │   alice is typing…                                   │
   │  ──────────────────────────────────────────────────  │
   │  [ Type a message...                          ] ➤    │
   └──────────────────────────────────────────────────────┘
```

---

## 3. The three things in the app

| Thing | What it is | Example |
|---|---|---|
| 👤 **User** | A person. Created automatically the first time they sign in with Google/GitHub. | `srinu-desetti` |
| 🚪 **Room** | A chat channel. Is **either public or private**. Has one **creator** (the admin). | `# general` |
| 💬 **Message** | Text sent by a user inside a room. Saved so you see history when you return. | "Hey everyone!" |

---

## 4. Public vs Private — the core idea

```
        🌐 PUBLIC ROOM                      🔒 PRIVATE ROOM
   ══════════════════════            ══════════════════════════

   Anyone logged in can:              Anyone logged in can:
     ✅ see the room                    ❌ see the messages
     ✅ join instantly                  ❌ join by themselves
     ✅ read messages                   ✅ send a JOIN REQUEST
     ✅ send messages
                                      Only the CREATOR can:
   No permission needed.                ✅ approve / reject requests
   Like a town square. 🏙️               ✅ invite people directly

                                      Only MEMBERS can:
                                        ✅ read + send messages

                                      Like a locked meeting room. 🚪🔑
```

### Permission table

| Action | 🌐 Public room | 🔒 Private room |
|---|---|---|
| See the room exists | Anyone | Members only |
| Read messages | Anyone who joined | Members only |
| Send messages | Anyone who joined | Members only |
| Join | **Instantly** | **Request → creator approves** |
| Invite someone | Creator | Creator |
| Approve requests | — (none needed) | **Creator only** |
| Rename / delete room | Creator | Creator |

---

## 5. User journeys (step by step)

### 🅐 Signing in

```
 [ Zentro login page ]
        │
        │  click "Continue with Google"
        ▼
 [ Google asks: allow Zentro? ]
        │  you click Allow
        ▼
 First time?  ──── YES ──▶  Create profile  (name, photo, username)
        │
        NO
        ▼
 [ You're in — room list ]
```
✅ **No passwords ever.** Your name and photo come from Google/GitHub.

---

### 🅑 Joining a PUBLIC room

```
 [ Browse rooms ]  ──▶  # gaming  🌐  [ Join ]
                                        │  click
                                        ▼
                              ✅ You are now a member
                                        │
                                        ▼
                              💬 Start chatting immediately
```
**No approval. No waiting.**

---

### 🅒 Joining a PRIVATE room (the approval flow)

```
   YOU                                          CREATOR (admin)
   ───                                          ───────────────

 # team-secret 🔒
 [ Request to join ]
        │
        │ click
        ▼
 ⏳ "Request sent,                    🔔 Notification appears:
     waiting for approval"               "srinu wants to join
        │                                 # team-secret"
        │                                       │
        │                                 [ Approve ]  [ Reject ]
        │                                       │
        │                                       │ clicks Approve
        │◀──────────────────────────────────────┘
        ▼
 🔔 "You were approved!"
        │
        ▼
 ✅ You are now a member  ──▶  💬 You can read + send messages
```

**If rejected** → you stay out, and cannot read any messages.

---

### 🅓 Creating a room

```
 [ + Create room ]
        │
        ▼
 ┌──────────────────────────────────┐
 │  Create a new room          ✕    │
 │                                  │
 │  Room name                       │
 │  [ # study-group            ]    │
 │                                  │
 │  Who can join?                   │
 │   ( ) 🌐 Public  — anyone        │
 │   (•) 🔒 Private — I approve     │
 │                                  │
 │        [ Cancel ]  [ Create ]    │
 └──────────────────────────────────┘
        │
        ▼
 You are the CREATOR (admin) and the first member.
```

---

### 🅔 Inviting someone (creator only)

```
 [ + Invite people ]
        │
        ▼
 ┌──────────────────────────────────┐
 │  Invite to # study-group     ✕   │
 │                                  │
 │  🔍 [ ali                    ]   │   ← type a username
 │  ──────────────────────────────  │
 │  👤 alice          [ Invite ]    │   ← live search results
 │  👤 alex23         [ Invite ]    │
 │  👤 alicia      ✓ Invited        │
 └──────────────────────────────────┘
```
The creator adds people **directly by username** — no request needed.

---

## 6. What makes it "real-time"

Everything below happens **instantly**, with no page refresh:

| Feature | What you see |
|---|---|
| 💬 New message | Appears immediately in everyone's window |
| ✍️ Typing indicator | "alice is typing…" |
| 🟢 Presence | Green dot = online, grey = offline |
| 🔔 Join request | Creator gets notified the moment someone asks |
| 🔔 Approval | Requester is told the moment they're let in |
| 🚪 Join / leave | "bob joined the room" |

---

## 7. Feature list

### ✅ Already working

- Sign in with **Google**
- Sign in with **GitHub**
- Profile auto-created (name, photo, unique username)
- Create a room (you become creator)
- Invite a person by username
- Send + receive messages in real time
- Typing indicator, presence, message history
- Runs on **multiple servers** kept in sync

### 🔜 To be built

- Room is **public or private** (choose at creation)
- **Browse public rooms** you haven't joined
- **Join a public room** with one click
- **Request to join** a private room
- Creator sees a **pending requests list**
- Creator **approves or rejects** requests
- 🔔 **Live notifications** for requests and approvals
- Replace the fake demo users with real ones

> ⚠️ **Today the chat screen shows fake users (alice, bob, charlie) that reply
> automatically.** They are a placeholder simulation living in the browser.
> They will be removed when the screen is connected to the real server.

---

## 8. The screens

```
┌───────────────┬───────────────────────────────┬─────────────────┐
│  SIDEBAR      │        CHAT PANEL              │   MEMBERS       │
├───────────────┼───────────────────────────────┼─────────────────┤
│ 💬 Zentro     │  # general  🌐         👑      │  In this room   │
│               │  ─────────────────────────────│                 │
│ 🔍 search...  │                                │ 🟢 alice (you)  │
│               │   alice  10:02                 │ 🟢 bob          │
│ MY ROOMS      │   ┌───────────────────┐        │ ⚪ charlie      │
│ # general  ●  │   │ Hey everyone! 👋  │        │                 │
│ # gaming      │   └───────────────────┘        │ ───────────     │
│ # secret 🔒   │                                │ + Invite people │
│               │              me  10:03         │                 │
│ DISCOVER      │        ┌──────────────────┐    │ ⏳ REQUESTS (2) │
│ # study  Join │        │ Hi! welcome 🎉   │    │ srinu  ✓  ✗     │
│ # team   🔒   │        └──────────────────┘    │ dj     ✓  ✗     │
│      Request  │                                │                 │
│               │  alice is typing…              │                 │
│ + Create room │  [ Type a message...      ] ➤ │                 │
│ 🟢 you        │                                │                 │
└───────────────┴───────────────────────────────┴─────────────────┘
   ▲                        ▲                          ▲
   rooms you're in,         messages, newest at        who's here +
   plus PUBLIC rooms        the bottom, yours on       pending join
   you can discover         the right in purple        requests (admin)
```

| Screen | Purpose |
|---|---|
| **Login** | Two buttons: Continue with Google / GitHub |
| **Room list** | Your rooms + discoverable public rooms |
| **Chat** | Messages, typing, send box |
| **Members** | Who's in the room + pending requests (creator sees these) |
| **Create room** | Name + public/private choice |
| **Invite** | Search by username, click Invite |

---

## 9. Why two servers? (the hidden purpose)

Zentro is also a demonstration of **scaling real-time chat**.

```
   ❌ WITHOUT a message bus              ✅ WITH Valkey

   alice ──▶ Server A                    alice ──▶ Server A ──┐
                                                              │
   bob   ──▶ Server B                                      Valkey
                                                              │
   Server A doesn't know                 bob   ──▶ Server B ──┘
   about bob. Message lost. 💔
                                         Server A publishes,
                                         Server B receives.
                                         alice and bob chat. 🎉
```

**Valkey** is a message bus sitting between the servers. When alice sends a
message, her server publishes it to Valkey; bob's server is subscribed, receives
it, and delivers it to bob.

This is what lets Zentro **add more servers without breaking chat**.

---

## 10. Rules summary (one screen)

```
 ┌─────────────────────────────────────────────────────────────┐
 │  1. You must sign in (Google or GitHub). No passwords.      │
 │                                                             │
 │  2. Every room is PUBLIC 🌐 or PRIVATE 🔒.                   │
 │                                                             │
 │  3. PUBLIC   → anyone sees it, joins it, chats in it.       │
 │                                                             │
 │  4. PRIVATE  → only members see messages.                   │
 │                Outsiders may only REQUEST to join.          │
 │                The CREATOR approves or rejects.             │
 │                                                             │
 │  5. The CREATOR is the admin: invites, approves,            │
 │     renames, deletes.                                       │
 │                                                             │
 │  6. Nobody can read or send in a private room               │
 │     without approval.                                       │
 │                                                             │
 │  7. Everything is instant — messages, typing, presence,     │
 │     and notifications.                                      │
 └─────────────────────────────────────────────────────────────┘
```

---

## 11. Build order

```
  STEP 1  ▸  Room gets a "public / private" setting
  STEP 2  ▸  Browse + join public rooms
  STEP 3  ▸  Request to join private rooms
  STEP 4  ▸  Creator approves / rejects  +  🔔 notifications
  STEP 5  ▸  Connect the chat screen to the real server
             (delete the fake alice / bob / charlie)
  STEP 6  ▸  Room browser UI + requests panel
```

> **Step 5 is the most important.** Until it's done, the screen shows a
> simulation and none of the other steps are visible to a user.