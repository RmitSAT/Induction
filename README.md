# 🪼 Sứa Khám Phá — SAT Explorer 2026B

Mobile-first web app for SAT Induction Day on **9 July 2026, 17:00–20:00, Room 3A**.  
Built with plain HTML + Tailwind CSS + Vanilla JS + Firebase.

---

## 🚀 Quick Start — Deployment

### 1. Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it (e.g. `sat-explorer-2026b`)
3. Enable **Google Analytics** (optional)

### 2. Enable Firebase Services

In the Firebase Console sidebar:

| Service | Steps |
|---|---|
| **Firestore Database** | Build → Firestore → Create database → **Start in test mode** → choose region (asia-southeast1 recommended) |
| **Authentication** | Build → Authentication → Get started → Sign-in method → **Email/Password** → Enable |

> ✅ **Storage is NOT needed.** Member photos are compressed to ~80KB and stored as base64 strings inside Firestore documents. This keeps everything on the **free Spark plan**.

### 3. Register a Web App & Get Config

1. Project Overview → **< / >** (Web)
2. Register app name, check "Firebase Hosting" if wanted
3. Copy the `firebaseConfig` object

### 4. Paste Config into the Project

Open `js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc123"
};
```

### 5. Create the Admin Account

1. Firebase Console → Authentication → Users → **Add user**
2. Set email: `admin@sat.vn` (or whatever you prefer)
3. Set a strong password
4. The admin uses these credentials to log in at `/admin/index.html`

### 6. Apply Firestore Rules

1. Firebase Console → Firestore → **Rules** tab
2. Paste the contents of `firestore.rules` and click **Publish**

### 7. Apply Storage Rules

> ✅ **Skip this step** — Storage is not used. Photos go into Firestore as base64.

### 8. Seed the Database (Before Event)

Log in to the admin panel (`/admin/index.html`) and:

1. Go to **Questions** page
2. Click **"Seed Default Statements"** — adds 10 T/F ice-breaker statements
3. Click **"Seed Default Quiz Questions"** — adds 5 SAT quiz questions
4. **Edit quiz questions** with accurate SAT content (this semester's theme, etc.)
5. Go to **Dashboard** → set Archive Pearl form links under **Event Phase Control** → update `config/settings` in Firestore directly or build settings UI

To set the Archive Pearl links, go to Firestore Console → `config/settings` → add fields:
- `archivePearlLinkNewbie`: `https://forms.zohopublic.com/...` (your Zoho form URL)
- `archivePearlLinkOldbie`: `https://...` (your SAT Reflection Survey URL)

### 9. Deploy to GitHub Pages

1. Push all files to your GitHub repository
2. Go to repo **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Save — your site will be live at `https://yourusername.github.io/repo-name/`

---

## 📁 File Structure

```
/
├── index.html              ← Member login
├── register.html           ← Member registration (3 steps)
├── dashboard.html          ← Mission Hub
├── profile.html            ← Member profile + QR code
├── archive-pearl.html      ← B02: Archive Pearl Mission
├── sat-quiz.html           ← B03: SAT Ocean Map Quiz
├── find-fellow.html        ← B04: Find Your Fellow Sứa
├── badges.html             ← Badge collection viewer
├── team.html               ← Team display
├── leaderboard.html        ← Public leaderboard
├── admin/
│   ├── index.html          ← Admin login
│   ├── dashboard.html      ← Stats + phase control
│   ├── members.html        ← Member CRUD
│   ├── badges.html         ← Badge manual override + mass unlock
│   ├── teams.html          ← Team generator + bonding
│   ├── leaderboard.html    ← Team score editor
│   ├── projector.html      ← Projector-mode screens
│   ├── export.html         ← CSV/JSON data export
│   └── questions.html      ← T/F statements + quiz editor
├── css/style.css           ← All custom styles
├── js/
│   ├── firebase-config.js  ← ⚠️ FILL IN YOUR FIREBASE CONFIG HERE
│   ├── auth.js             ← Member session management
│   └── qr-utils.js         ← QR code helpers
├── firestore.rules         ← Paste into Firestore Console → Rules
└── storage.rules           ← Paste into Storage Console → Rules
```

---

## 🗄️ Firestore Database Schema

### `members/{memberId}`
```
name:              string
dateOfBirth:       string        "YYYY-MM-DD"
major:             string
school:            string
status:            "newbie" | "oldbie"
satType:           "spotlight" | "flow" | "care" | "creative" | "calm"
photoURL:          string        base64 data URL (compressed JPEG, ~80KB, stored in Firestore)
accessCode:        string        6-char unique (e.g. "X4K9QR")
checkedIn:         boolean
checkinTime:       timestamp
teamId:            string | null
archivePearlDone:  boolean
quizPassed:        boolean
quizScore:         number
quizAttempts:      number
quizLive:          map           {active, currentQuestion, totalQuestions, correctCount, totalPoints, startedAt, updatedAt}
bondingCompleted:  boolean
fellowProgress:    number        0–10 (tiles unlocked)
unlockedTiles:     number[]      e.g. [0,2,5]
tileHelpers:       map           {0:"Nguyen Van A", 2:"Tran Thi B"}
trueFalseAnswers:  map           {tf_01: true, tf_02: false, ...}
points:            number        running total (legacy, not always in sync with badge sums — see note below)
createdAt:         timestamp
jellySpecies:         string      e.g. "Jelly1" (one of Jelly1/Jelly2/Jelly5/Jelly6/Jelly7/Jelly8), unset until chosen on first login
jellySpeciesChosenAt: timestamp
jellyHatchSeen:       boolean     one-time egg→junior hatch celebration already shown
jellySeniorSeen:      boolean     one-time senior (all-badges) celebration already shown
bonusPoints:          number      non-badge bonus only (e.g. Early Diver's +5)
```

**Jellyfish evolution points**: the total used to pick the egg/junior/senior avatar phase (`js/jelly.js`) is `sum(unlocked badge.points) + (member.bonusPoints || 0)`, computed fresh on each page load from the `badges` subcollection — this is the authoritative total for evolution purposes and may differ slightly from the legacy `points` field above, which is kept for backward compatibility only.

### `members/{memberId}/badges/{badgeId}`  (B01–B06)
```
unlocked:       boolean
unlockedAt:     timestamp | null
adminOverride:  boolean
points:         number        (10/10/20/30/25/50)
```

### `members/{memberId}/fellowScans/{targetMemberId}`
```
tilesHelped:    number[]     tile indices this target helped unlock (max 2)
lastScannedAt:  timestamp
```

### `teams/{teamId}`
```
name:       string       "Team Sứa 1"
memberIds:  string[]
score:      number
bondingDone: boolean
colorHex:   string
createdAt:  timestamp
```

### `quizQuestions/{qId}`
```
question:       string
mediaType:      "none" | "image" | "video"
mediaData:      string       base64 image or YouTube/mp4 URL
options:        string[]     ["A. ...", "B. ...", "C. ...", "D. ..."]
multiSelect:    boolean
correctIndexes: number[]     e.g. [0] or [0,2] for multi-answer
correctIndex:   number       legacy/back-compat mirror = correctIndexes[0]
points:         number       max points for a correct, instant answer (default 100)
timeLimit:      number       per-question countdown in seconds (default 20)
order:          number
active:         boolean
```

### `trueFalseStatements/{sId}`  (tf_01 … tf_10)
```
statement:  string
order:      number   1–10
active:     boolean
```

### `config/settings`
```
eventActive:               boolean
currentPhase:              string    "registration"|"archive-pearl"|"sat-quiz"|"find-fellow"|"team-formation"|"bonding"|"completed"
archivePearlLinkNewbie:    string    Zoho form URL
archivePearlLinkOldbie:    string    SAT Reflection Survey URL
quizPassMark:              number    3  (correct answers needed)
fellowTilesRequired:       number    6  (tiles to unlock badge)
maxTilesPerTarget:         number    2  (max tiles per scanned person)
teamSizeMin:               number    6
teamSizeMax:               number    8
leaderboardVisible:        boolean
registrationOpen:          boolean
```

### `scanLogs/{autoId}`
```
scannerId:  string    member ID of scanner
targetId:   string    member ID of target
tileIndex:  number    0–9
result:     boolean   true = matched
timestamp:  timestamp
```

---

## 🏅 Badge Unlock Logic

| Badge | Trigger |
|---|---|
| B01 First Dive | Auto-unlocked on registration completion |
| B02 Archive Pearl | Member self-confirms form submission |
| B03 SAT Map Reader | Quiz score ≥ passMark (default 3/5) |
| B04 Friendship Reef | fellowProgress ≥ 6 (auto on tile unlock) |
| B05 Current Crew | Admin marks team bonding done (admin/teams.html) |
| B06 Full Explorer | B01–B05 all unlocked (auto-check after each unlock) |

---

## 🕹️ Find Your Fellow Sứa — Game Rules

- Each member has 10 mission tiles (from the 10 T/F statements answered at registration)
- To unlock tile N: scan/enter another member's 6-char access code
- The system checks if that member answered **TRUE** for statement N
- **No self-scan**
- **Max 2 tiles per target member**
- Unlock **6/10 tiles** → Friendship Reef Badge unlocked automatically

---

## 👑 Admin Panel

Access at `/admin/index.html` → login with Firebase Email/Password credentials.

| Page | Function |
|---|---|
| dashboard.html | Stats, event phase control, quick nav |
| members.html | Search, edit, delete, view QR of any member |
| badges.html | Mass-unlock badge for all, or individual override |
| teams.html | Generate balanced teams, mark bonding complete |
| leaderboard.html | Adjust team scores ±5 |
| projector.html | Fullscreen screens for venue projector |
| export.html | Download CSVs/JSON after event |
| questions.html | Edit T/F statements and quiz questions |

---

## 🎨 Design System

| Color | Hex | Usage |
|---|---|---|
| Ocean Deep | #03045E | Page backgrounds, nav |
| Ocean Dark | #023E8A | Secondary backgrounds |
| Ocean Mid | #0077B6 | Primary buttons, CTAs |
| Sky Blue | #00B4D8 | Badges, chips, accents |
| Foam Blue | #ADE8F4 | Card borders, light fills |
| Mist Blue | #CAF0F8 | Page background |
| Coral Red | #D62828 | Admin, warnings, danger |

Font: **Nunito** (Google Fonts) — loaded via `<link>` in each HTML file.

---

## 🔧 Pre-Event Checklist

- [ ] Firebase project created and configured
- [ ] `js/firebase-config.js` updated with real credentials
- [ ] Admin email/password created in Firebase Auth
- [ ] Firestore rules published (Storage rules not needed — photos stored in Firestore)
- [ ] T/F statements seeded and reviewed (admin/questions.html)
- [ ] Quiz questions seeded and edited with real SAT content (set points/timeLimit per question)
- [ ] Archive Pearl form links set in Firestore `config/settings`
- [ ] Site deployed to GitHub Pages
- [ ] Tested on mobile Chrome (Android) and Safari (iOS)
- [ ] QR code posters printed with site URL

---

## 📱 Mobile Testing

Test these flows on real phones before the event:
1. Register → get access code → screenshot it
2. Login → navigate all mission pages
3. Archive Pearl → open external link → confirm
4. Quiz → answer 5 questions → pass/fail
5. Find Fellow → tap tile → scan QR code with camera
6. Profile → show QR code for others to scan

---

*Built for SAT The Explorer 2026B · Sứa Khám Phá · 9 July 2026*
