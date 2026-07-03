# 💬 Real-Time Chat App — Frontend Design (Look & Feel)

> This document explains **ONLY the frontend** — how the app looks, the colors,
> the screens, and the layout. It does **NOT** cover the backend, database, or
> WebSocket server code. This is the visual blueprint before any coding.

---

## 1. What the app is (one line)

A web chat app where users **log in with a unique username**, **create rooms**,
**invite people by searching usernames**, and **chat in real time**.

---

## 2. 🎨 Color Palette

A clean, modern **dark theme** with a calm purple/indigo accent — easy on the
eyes for long chat sessions.

| Role | Color | Hex | Used for |
|------|-------|-----|----------|
| **Primary / Accent** | 🟣 Indigo | `#6C5CE7` | Buttons, links, active room, my own messages |
| **Primary Hover** | 🟣 Deep Indigo | `#5848D9` | Button hover state |
| **Background (App)** | ⚫ Dark Navy | `#0F1117` | Whole page background |
| **Surface / Cards** | ⚫ Slate | `#1A1D26` | Sidebar, chat panel, modals |
| **Surface 2** | ⚫ Light Slate | `#242836` | Input boxes, other people's messages |
| **Text Primary** | ⚪ White | `#F5F6FA` | Main text |
| **Text Muted** | ⚪ Gray | `#8B90A0` | Timestamps, hints, placeholders |
| **Success / Online** | 🟢 Green | `#00D26A` | "Online" dot, success toasts |
| **Danger / Error** | 🔴 Red | `#FF4757` | Errors, "leave room", offline dot |
| **Border** | ➖ Faint Gray | `#2A2E3C` | Lines between sections |

> 💡 Optional **Light theme** swap: Background `#F5F6FA`, Surface `#FFFFFF`,
> text `#0F1117`, keep the same indigo accent.

---

## 3. ✍️ Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Logo / Headings | **Poppins** | 20–28px | 600–700 |
| Body / Messages | **Inter** | 14–15px | 400–500 |
| Timestamps / hints | Inter | 12px | 400 |

Fallback stack: `Inter, "Segoe UI", system-ui, sans-serif`.

---

## 4. 🖥️ Screens (how each looks)

### Screen 1 — Login / Sign Up
A centered card on the dark background.

```
        ┌──────────────────────────────┐
        │            💬                 │
        │       ChatRoom                │
        │   Talk in real time           │
        │                               │
        │  👤  [ username            ]  │
        │  🔒  [ password            ]  │
        │                               │
        │     [   Log In   ]  (indigo)  │
        │                               │
        │  New here?  Create account    │
        └──────────────────────────────┘
```
- Card uses **Surface** color, rounded corners (16px), soft shadow.
- Inputs use **Surface 2** with a faint border; border turns **indigo** on focus.
- If username is taken → red helper text: *"Username already taken."*

---

### Screen 2 — Main Chat Layout (the core screen)
A classic **3-column** layout (like Slack / Discord).

```
┌───────────────┬───────────────────────────────┬─────────────────┐
│  SIDEBAR      │        CHAT PANEL              │   MEMBERS       │
│  (rooms)      │                                │   (people)      │
├───────────────┼───────────────────────────────┼─────────────────┤
│ 💬 ChatRoom   │  # general-room       👑       │  In this room   │
│               │  ─────────────────────────────│                 │
│ 🔍 search...  │                                │ 🟢 alice (you)  │
│               │   alice  10:02                 │ 🟢 bob          │
│ # general  ●  │   ┌───────────────────┐        │ ⚪ charlie      │
│ # gaming      │   │ Hey everyone! 👋  │        │                 │
│ # study       │   └───────────────────┘        │ ───────────     │
│               │                                │ + Invite people │
│               │              me  10:03         │                 │
│ + Create room │        ┌──────────────────┐    │                 │
│               │        │ Hi! welcome 🎉   │(indigo)             │
│ ─────────     │        └──────────────────┘    │                 │
│ 🟢 alice      │                                │                 │
│ ⚙️  settings  │  [ Type a message...      ] ➤ │                 │
└───────────────┴───────────────────────────────┴─────────────────┘
```

**Left Sidebar (Surface color)**
- App logo at top.
- List of rooms you're in. The **active room** is highlighted in **indigo**.
- A green **dot ●** shows rooms with new/unread messages.
- **+ Create room** button at the bottom (indigo).
- Your username + online dot + settings at the very bottom.

**Middle Chat Panel (App background)**
- **Header:** room name `# general-room` and a 👑 crown if you're the creator.
- **Messages:**
  - **My messages** → right side, **indigo** bubble, white text.
  - **Others' messages** → left side, **Surface 2** bubble, with username + time above.
  - Small avatar circle (first letter of username) beside each.
- **"alice is typing…"** muted text appears above the input.
- **Input bar** at bottom: rounded text field + indigo send button **➤**.

**Right Members Panel (Surface color)**
- Title: *"In this room"*.
- List of members, each with:
  - 🟢 green dot = online, ⚪ gray dot = offline.
  - `(you)` label next to your own name.
- **+ Invite people** button (opens the invite modal).

> 📱 On **mobile**, the side panels collapse. You see the chat full-screen, and a
> ☰ menu button slides the rooms list in/out.

---

### Screen 3 — Create Room (modal popup)
A small centered modal over a dimmed background.

```
        ┌──────────────────────────────┐
        │  Create a new room        ✕   │
        │                               │
        │  Room name                    │
        │  [ # study-group          ]   │
        │                               │
        │  [ Cancel ]   [ Create ]      │
        └──────────────────────────────┘
```

---

### Screen 4 — Invite People (search by username)
Opens when you click **+ Invite people**. This is the unique-username search.

```
        ┌──────────────────────────────┐
        │  Invite to # study-group   ✕  │
        │                               │
        │  🔍 [ search username...   ]  │
        │  ───────────────────────────  │
        │  👤 alice          [ Invite ] │
        │  👤 alex23         [ Invite ] │
        │  👤 alicia    ✓ Invited(green)│
        │                               │
        └──────────────────────────────┘
```
- As you type, **matching unique usernames appear live**.
- Each row has an **Invite** button → turns into ✓ **Invited** (green) once sent.

---

## 5. 🧩 Reusable UI Components

| Component | Description |
|-----------|-------------|
| **Button** | Indigo filled (primary) / outlined (secondary) / red (danger) |
| **Input** | Surface-2 background, indigo focus ring, muted placeholder |
| **Avatar** | Circle with the first letter of the username, colored bg |
| **Message Bubble** | Rounded; indigo (mine) vs slate (others) |
| **Online Dot** | Small green/gray circle |
| **Modal** | Centered card + dimmed backdrop, ✕ to close |
| **Toast** | Top-right popup: green (success) / red (error) |

---

## 6. ✨ Small touches that make it feel "real-time"

- New messages **slide/fade in** smoothly (≈150ms).
- **"typing…"** indicator with animated dots.
- Online dots update **instantly** when people join/leave.
- Auto-scroll to the newest message.
- A subtle **sound / badge** when a new message arrives in another room.

---

## 7. 📐 Layout Rules (spacing)

- Corner radius: **16px** cards, **12px** inputs/buttons, **18px** message bubbles.
- Padding: **16–24px** inside panels.
- Sidebar width: **260px** · Members panel: **220px** · Chat = remaining space.
- Max message bubble width: **70%** of the chat panel.

---

## 8. 🗂️ Suggested frontend file structure (for later)

```
frontend/
├── index.html
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Chat.jsx
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── ChatPanel.jsx
│   │   ├── MembersPanel.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── CreateRoomModal.jsx
│   │   └── InviteModal.jsx
│   ├── styles/
│   │   └── theme.css      ← the color palette lives here
│   └── App.jsx
```

> Recommended (not required) stack for this look: **React + plain CSS / Tailwind**.

---

### ✅ Summary
- **Theme:** Dark, modern, indigo accent (`#6C5CE7`).
- **Main screen:** 3 columns → Rooms | Chat | Members.
- **Key screens:** Login, Chat, Create Room, Invite-by-username.
- **Feel:** Smooth, real-time, Slack/Discord-like.

*This file describes the frontend look only. Backend (Node, WebSockets, Valkey) is intentionally not included here.*