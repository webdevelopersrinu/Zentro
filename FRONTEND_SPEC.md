# 🎨 Zentro — Frontend Specification

> What we build, what the user sees, and exactly how they move through it.
> No code. Read this, disagree with it, then we build.
>
> Companion to [APPLICATION_PLAN.md](./APPLICATION_PLAN.md) (the *product*) —
> this document is the *interface*.

---

## 0. Where we are

| Layer | Status |
|---|---|
| Backend (rooms, requests, sockets, auth) | ✅ Done — 248 tests |
| Frontend auth (login, silent refresh, session) | ✅ Done |
| **Frontend chat (this document)** | ❌ To build |

---

## 1. The screen map

Zentro is a **single-page app with two screens**. Everything else is a *state*
of the chat screen, not a new page. That is deliberate: a chat app that
navigates between pages loses its socket and its scroll position.

```
                    ┌──────────────────┐
                    │   1. LOGIN       │  not signed in
                    └────────┬─────────┘
                             │ Google / GitHub
                    ┌────────▼─────────┐
                    │   2. LOADING     │  silent /auth/refresh   (~200ms)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   3. CHAT        │  the app
                    └──────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   NO ROOM PICKED      ROOM OPEN            LOCKED ROOM
   (first run)         (normal)             (private, not a member)
```

### Screen 3 is three columns

```
┌─────────────────┬─────────────────────────────┬──────────────────┐
│  SIDEBAR        │   CONVERSATION              │   MEMBERS        │
│  288px          │   flex                      │   264px          │
├─────────────────┼─────────────────────────────┼──────────────────┤
│ ⚡ Zentro       │  # general  🌐  · 12 members │  MEMBERS · 12    │
│                 │ ─────────────────────────── │                  │
│ 🔍 Search       │                             │  ● alice   (you) │
│                 │   ┌──────────────────┐      │  ● bob        👑 │
│ MY ROOMS        │   │ Hey everyone 👋  │      │  ○ charlie       │
│ # general   ●   │   └──────────────────┘      │                  │
│ # gaming        │        alice · 10:02        │  ─────────────   │
│ # secret   🔒   │                             │                  │
│                 │            ┌─────────────┐  │  ⏳ REQUESTS · 2 │
│ DISCOVER        │            │ Hi! 🎉      │  │  srinu   ✓  ✗    │
│ # study    Join │            └─────────────┘  │  dj      ✓  ✗    │
│ # team  🔒 Ask  │                 you · 10:03 │                  │
│                 │                             │  ─────────────   │
│ ─────────────   │  alice is typing…           │  + Invite people │
│ + Create room   │ ─────────────────────────── │                  │
│                 │  [ Message #general ]   ➤   │                  │
│ 👤 You    ☀️ ⎋  │                             │                  │
└─────────────────┴─────────────────────────────┴──────────────────┘
```

---

## 2. Every state of the chat screen

| State | Trigger | What the user sees |
|---|---|---|
| **Loading** | first paint | Skeleton rooms in the sidebar, skeleton bubbles in the panel. **Never a spinner** — skeletons preserve layout and feel faster. |
| **No rooms at all** | brand-new account | Centred illustration: *"You're not in any rooms yet."* → **Browse public rooms** button, scrolls to Discover. |
| **No room selected** | has rooms, none open | *"Pick a room to start talking."* |
| **Room open** | normal | Messages, input focused. |
| **Locked room** | clicked a private room they're not in | Card: 🔒 *"# team is private."* → **Request to join**. Messages are never fetched. |
| **Request pending** | after requesting | Button becomes **Requested ✓**, disabled. |
| **Empty room** | room has no messages | *"No messages yet — say hello."* |
| **Reconnecting** | socket drops | Slim amber banner at top: *"Reconnecting…"*. Composer disabled. |
| **Session expired** | refresh fails | Falls back to Login with a toast. |

---

## 3. User flows

### 🅐 First run — a brand-new account

```
sign in
   ↓
sidebar: MY ROOMS is empty
   ↓
main panel: "You're not in any rooms yet."   [Browse public rooms]
   ↓
click → focus moves to DISCOVER section
   ↓
# general 🌐  [ Join ]
   ↓ click Join
✅ optimistic: room jumps to MY ROOMS instantly, it opens, input focused
   ↓
socket joins the room · history loads · you can talk
```

### 🅑 Joining a public room

```
DISCOVER → # gaming 🌐 → [ Join ]
        │
        ├─ button → loading spinner
        ├─ POST /rooms/:id/join
        ├─ ✅ 200 → room moves to MY ROOMS, opens, toast "Joined #gaming"
        └─ ❌ error → button restores, toast with the reason
```
**No approval. No waiting.** One click, you're in.

### 🅒 Requesting a private room (the approval dance)

```
        YOU                                       CREATOR
        ───                                       ───────

DISCOVER → # team 🔒
[ Request to join ]
      │ click
      ├─ POST /rooms/:id/join
      ├─ 200 { requested: true }
      ▼
[ Requested ✓ ]  (disabled)                🔔 toast: "srinu wants to join #team"
Toast: "Request sent"                       Sidebar badge on # team → ⏳ 1
Room stays in DISCOVER, locked              MEMBERS panel → REQUESTS · 1
      │                                            │
      │                                     [ ✓ Approve ]  [ ✗ Reject ]
      │                                            │ clicks Approve
      │◀─────────── socket: request:approved ──────┘
      ▼
🔔 Toast: "You were approved for #team"
Room moves DISCOVER → MY ROOMS automatically
Click it → chat opens
```

**If rejected:** toast *"Your request for #team was declined."* The room stays in
Discover with the **Request to join** button restored. No messages ever loaded.

> ⚠️ Requesting grants **nothing**. The button changing is the only thing that
> happens client-side. The server refuses `/messages` with 403 either way.

### 🅓 Creating a room

```
[ + Create room ]
      ↓  <dialog> — focus trapped, Esc closes
┌────────────────────────────────────┐
│  Create a room                 ✕   │
│                                    │
│  Room name                         │
│  [ study-group            ]  8/40  │  ← native required + maxlength
│                                    │
│  Who can join?                     │
│  ┌──────────────┐ ┌──────────────┐ │
│  │ 🌐 Public    │ │ 🔒 Private   │ │  ← radio cards, keyboard navigable
│  │ Anyone joins │ │ You approve  │ │
│  └──────────────┘ └──────────────┘ │
│                                    │
│           [ Cancel ]  [ Create ]   │
└────────────────────────────────────┘
      ↓ Create
Room appears at the top of MY ROOMS, opens, composer focused.
You are the creator 👑.
```

### 🅔 Inviting (creator only)

```
MEMBERS panel → [ + Invite people ]
      ↓
┌────────────────────────────────────┐
│  Invite to # study-group       ✕   │
│  🔍 [ ali|                     ]   │  ← debounced 300ms
│  ──────────────────────────────    │
│  ⏳ searching…                     │
│  👤 alice      Alice     [ Invite ]│
│  👤 alex23     Alex      [ Invite ]│
│  👤 alicia     Alicia    ✓ Invited │  ← optimistic, then confirmed
└────────────────────────────────────┘
```
Typing fewer than 2 characters shows *"Keep typing…"* — we do not query on
one letter. No results → *"No user named 'zzz'."*

### 🅕 Sending a message

```
type → keystroke 1 fires `typing: true` (throttled to 1 per 2s)
     → stop typing → after 2s idle, `typing: false`

Enter          → send
Shift + Enter  → newline
empty input    → send button disabled

send:
   1. optimistic bubble appears immediately, status = sending (subtle opacity)
   2. socket.emit("message:send", ack)
   3. ack ok    → replace temp id with the real one, full opacity
      ack error → bubble turns red, "Failed · Retry" link
```

**Auto-scroll rule:** stick to the bottom only if the user is already within
~100px of it. Otherwise show a **"↓ 3 new messages"** pill — never yank someone
away from what they're reading.

### 🅖 Receiving

| Event | Where you are | What happens |
|---|---|---|
| `message:new` | in that room | Bubble slides in. Scroll if pinned. |
| `message:new` | in another room | Sidebar dot ● on that room. No toast (too noisy). |
| `request:new` | anywhere | 🔔 toast + ⏳ badge on the room + Requests panel updates |
| `request:approved` | anywhere | 🔔 toast, room moves to My Rooms |
| `request:rejected` | anywhere | 🔔 toast |
| `room:invited` | anywhere | 🔔 toast, room appears in My Rooms |
| `presence:joined/left` | in that room | Member dot flips ●/○ |
| `typing` | in that room | "alice is typing…" (3+ → "alice and 2 others") |

---

## 4. Component tree

Every component under **100 lines**. Primitives know nothing about chat.

```
<App>
 └─ <ChatLayout>
     ├─ <ConnectionBanner/>                     reconnecting / offline
     │
     ├─ <Sidebar>
     │   ├─ <Logo withWordmark/>
     │   ├─ <SearchInput/>                      filters both lists
     │   ├─ <RoomSection title="My Rooms">
     │   │   └─ <RoomListItem/> ×n              ← REUSED
     │   ├─ <RoomSection title="Discover">
     │   │   └─ <RoomListItem/> ×n              ← REUSED, different trailing slot
     │   ├─ <Button>+ Create room</Button>
     │   └─ <SidebarFooter/>                    avatar · theme toggle · sign out
     │
     ├─ <ConversationPanel>
     │   ├─ <ChatHeader/>                       name · 🌐/🔒 · member count · 👑
     │   ├─ <MessageList>                       virtualised past 150
     │   │   ├─ <DayDivider/>                   "Today", "Yesterday"
     │   │   └─ <MessageBubble/> ×n             memo'd
     │   ├─ <TypingIndicator/>
     │   ├─ <NewMessagesPill/>                  "↓ 3 new"
     │   └─ <MessageComposer/>
     │
     └─ <MembersPanel>
         ├─ <MemberRow/> ×n                     avatar · name · ● · 👑 · (you)
         ├─ <RequestsSection/>                  creator only
         │   └─ <RequestRow/> ×n                ✓ / ✗
         └─ <Button>+ Invite people</Button>

Overlays: <CreateRoomModal/> <InviteModal/> <ConfirmDialog/> <Toasts/>
```

### `RoomListItem` — one component, four trailing states

| Context | Trailing slot |
|---|---|
| My room | unread dot ● / nothing |
| My room, creator, pending requests | ⏳ 2 badge |
| Discover, public | **Join** button |
| Discover, private | **Request to join** / **Requested ✓** |

That is the single most reused component in the app.

---

## 5. State management

Two kinds of state, two tools. Conflating them is the classic bug factory.

```
SERVER STATE  ── TanStack Query ──┐
rooms, discover, messages,        │  cached, deduped, retried
members, requests                 │  socket events WRITE INTO the cache
                                  │  (no refetch storm)
CLIENT STATE  ── useState/Context ┘
activeRoomId, modal open, draft text, sidebar collapsed
```

### Query keys

```js
["rooms"]                        // my rooms
["rooms", "discover"]            // discoverable
["rooms", id, "messages"]        // history
["rooms", id, "members"]
["rooms", id, "requests"]        // creator only
["users", "search", query]       // invite box
```

### Socket → cache, never socket → refetch

| Event | Cache action |
|---|---|
| `message:new` | `setQueryData(["rooms", id, "messages"], append)` |
| `request:new` | `invalidateQueries(["rooms", id, "requests"])` |
| `request:approved` | `invalidateQueries(["rooms"])` + `["rooms","discover"]` |
| `presence:*` | `setQueryData(["rooms", id, "members"], flip dot)` |

A refetch on every message would be an N+1 disaster. We already have the data —
the socket handed it to us.

### Optimistic mutations

- **Send message** → append temp bubble, reconcile on ack
- **Join public room** → move between lists instantly, roll back on error
- **Approve request** → row disappears instantly, restore on error

---

## 6. Validation — native first

The rule: **let the browser do what the browser can do.** Reach for state only
when it genuinely cannot know the answer.

| Field | Method | Why |
|---|---|---|
| Room name | `required` `maxlength="40"` — **native** | Free error UI, free a11y |
| Visibility | `<input type="radio" required>` — **native** | |
| Message | `useState` + disabled when empty | No error text needed |
| Invite username | **stateful, debounced, async** | Only the server knows if a user exists |

Errors show on **blur/submit**, never per keystroke. `aria-invalid` +
`aria-describedby` wire the message to the field. **The server is the source of
truth** — zod already guards the API; client validation is UX only.

> This app has no password and no email field, so the usual "let the browser
> validate email, validate the password in state" advice does not apply here.
> The principle does.

---

## 7. Keyboard & accessibility

| Key | Action |
|---|---|
| `Enter` | Send message |
| `Shift + Enter` | Newline |
| `Esc` | Close modal / clear search |
| `/` | Focus search |
| `Tab` | Trapped inside open modals |

- Modals use native `<dialog>` → focus trap, Esc, and backdrop **for free**
- Focus returns to the trigger when a modal closes
- `aria-live="polite"` on toasts and on the message list
- Presence dots are not colour-only — they carry `aria-label="online"`
- Every icon-only button has an `aria-label`
- Contrast ≥ 4.5:1 in both themes
- `prefers-reduced-motion` disables animations

---

## 8. Performance

| Technique | Applied to |
|---|---|
| `React.memo` | `MessageBubble`, `RoomListItem`, `MemberRow` |
| Stable `useCallback` handlers | list item props |
| Keys = server `id` | **never** array index |
| Context splitting | Auth / Socket / Theme / Toast are four providers, so a socket event never re-renders the login state |
| Virtualisation | `MessageList` past ~150 messages |
| Debounce 300ms | user search |
| Throttle 2s | `typing` emit |
| `lazy()` | Chat screen — login paints without the chat bundle |
| CSS Modules | scoped, zero runtime, no inline `<style>` |
| `loading="lazy"` + fixed `width/height` | avatars (no layout shift) |

---

## 9. Real-time connection lifecycle

```
access token obtained
        ↓
socket connects  io(url, { auth: { token } })
        ↓
server: joins user:<id> + all my rooms
        ↓
server emits "ready"  ←── we wait for THIS, not "connect"
        ↓                  (before it, broadcasts can be missed)
app is live
        ↓
token refreshed (every 15 min) → tokenStore notifies → socket reconnects
        ↓
disconnect → banner "Reconnecting…" → composer disabled → auto-retry
```

---

## 10. Error, empty and loading states — all of them

| Situation | Treatment |
|---|---|
| Rooms loading | 5 skeleton rows |
| Messages loading | 3 skeleton bubbles |
| No rooms | Illustration + *Browse public rooms* |
| No messages | *No messages yet — say hello.* |
| Nothing to discover | *You're in every room. Create a new one?* |
| Search: no match | *No user named "zzz".* |
| Send failed | Red bubble + **Retry** |
| Join failed | Toast with the server's message, button restored |
| 403 on a private room | Locked card — not an error toast |
| Socket down | Amber banner, composer disabled |
| Session expired | Redirect to Login + toast |

Errors quote the **server's** message (`{ error }`), never a generic
"Something went wrong", except for genuine network failure.

---

## 11. Responsive

| Breakpoint | Layout |
|---|---|
| `≥ 1200px` | Three columns |
| `768–1199px` | Sidebar + conversation. Members panel becomes a drawer (👥 in header). |
| `< 768px` | One column. Sidebar is a drawer (☰). Composer pinned. `100dvh` so the iOS keyboard doesn't cover it. |

---

## 12. Build order

```
1. lib/socket.js            connect · wait for "ready" · reconnect on token change
2. services/room.service.js single axios instance, every endpoint
3. services/user.service.js search
4. hooks/                   useRooms · useDiscover · useMessages · useMembers ·
                            useRequests · useTyping · useSocketEvent · useDebounce
5. ui primitives            Input · Modal · Badge · PresenceDot · Skeleton · EmptyState · IconButton
6. chat components          Sidebar → Conversation → Members
7. modals                   CreateRoom · Invite · Confirm
8. socket → query cache wiring
9. tests                    Vitest + RTL + MSW per component; Playwright E2E for the
                            two-browser cross-server demo
```

---

## 13. Definition of done

- [ ] Two browsers, two accounts, one room → a message typed in one appears in the other
- [ ] Public room joins in one click
- [ ] Private room requires approval; the requester never sees a message before it
- [ ] Creator gets a live 🔔 for a join request without refreshing
- [ ] Approve/reject moves the room between lists on **both** screens, live
- [ ] Unread dot appears for a room you are not looking at
- [ ] Typing indicator appears and clears
- [ ] Presence dots flip when someone closes their tab
- [ ] Works on a phone
- [ ] Keyboard-only usable end to end
- [ ] Dark and light both pass contrast
- [ ] Zero `console.error` in a normal session
