# Allies

## Overview

**Allies** is a personal portfolio application that helps you keep track of important people in your life—friends, family, and their associated responsibilities. The app is designed for simplicity, privacy, and usability, built with a minimal tech stack and deployed on a private VPS.

Users can store contact details, birthdays, notes, and define "missions" (commitments or tasks) for each ally.

---

## 🎯 Goals

* Simplify the tech stack to pure frontend and a single backend binary (PocketBase)
* Use the project as a self-hosted, real-world portfolio piece
* Prioritize clarity, speed, and maintainability
* Develop a mobile application to interact with the server

---

## 🧱 Data Model (PocketBase Collections)

### Collection: `allies`

| Field      | Type  | Description                              |
| ---------- | ----- | ---------------------------------------- |
| `category` | text  | Relationship type (friend, family, etc.) |
| `fname`    | text  | First name                               |
| `lname`    | text  | Last name                                |
| `email`    | email | Unique contact email                     |
| `birthday` | date  | Birthdate                                |
| `pfp`      | file  | Profile picture                          |
| `note`     | text  | Notes or personal details                |

### Collection: `missions`

| Field         | Type     | Description                      |
| ------------- | -------- | -------------------------------- |
| `description` | text     | Task description                 |
| `due_date`    | date     | Deadline for the mission         |
| `ally`        | relation | One-to-many relation to `allies` |

---

## 🛠 Tech Stack

| Layer    | Tech                                                  |
| -------- | ----------------------------------------------------- |
| Frontend | HTML, CSS, Vanilla JavaScript                         |
| Backend  | [PocketBase](https://pocketbase.io) (SQLite embedded) |
| Hosting  | Private VPS (e.g. Hetzner, Linode, DigitalOcean)      |

No framework, no transpilers, no build tools — just clean, accessible code backed by a fast Go-based backend.

---

## 🔁 Application Flow

1. **User visits frontend** hosted on your VPS
2. **Frontend interacts with PocketBase** through its REST or JavaScript API
3. **Data** like allies and missions are created, read, updated, or deleted directly via API
4. **Realtime updates** optionally subscribed via PocketBase’s websocket layer

---

## 🔧 Development Phases

### ✅ Phase 1: Data Modeling

* Define collections using PocketBase admin UI

### ✅ Phase 2: Frontend MVP

* Build HTML/CSS/JS interface to:

  * View Allies
  * Add new Allies
  * Assign Missions
  * View Obligations

### ✅ Phase 3: Authentication

* Enable PocketBase auth (admin or user-based)
* Login screen for managing data securely

### ⏳ Phase 4: VPS Deployment

* Deploy PocketBase and static HTML files
* Secure via HTTPS + firewall
* Use systemd or PM2 to keep PocketBase running

### ⏳ Phase 5: Realtime UX Improvements

* Use WebSocket features to watch for changes

### ⏳ Phase 6: Mobile Responsiveness

* Polish design for mobile and tablet use

---

## 🗂 Folder Structure (Example)

```
/allies
├── /public
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── /assets
│   └── icons, profile images
├── /docs
│   └── architecture.md
└── pocketbase/
    └── pb_data/ (your database)
```

---

## 🚀 Deployment Notes

1. **Run PocketBase on VPS**

   ```bash
   ./pocketbase serve --http="0.0.0.0:8090"
   ```

2. **Serve static files** via:

   * Caddy
   * nginx
   * or even PocketBase’s static file support

3. **Protect admin dashboard** by firewalling port 8090 or using basic auth

---

## 📌 Example Code (JavaScript)

```js
// Connect to PocketBase
const pb = new PocketBase("https://your-vps-domain.com");

// Fetch allies
pb.collection('allies').getFullList().then(data => {
  data.forEach(ally => {
    console.log(`${ally.fname} ${ally.lname} - ${ally.category}`);
  });
});
```

---

## 🔐 Security

* PocketBase admin password stored securely on VPS
* Authenticated API access with token support
* Optional OAuth support (coming in future phases)

---

## 📦 License

This project is **not open to the public** at this time. It exists as a private, portfolio-facing application.

---

## 🚀 Future Enhancements

* AI-powered ally reminders (birthdays, deadlines)
* Notification/Email system (via cron + PocketBase)
* Mobile PWA version
* Export/import backup utility
---