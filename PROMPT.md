# CampusVote — Full-Stack College Voting Platform

> **How to use this file with Claude Code:**
> Open Claude Code and say: `"Read PROMPT.md and build this project"`

---

## TECH STACK

- **Frontend:** React (Vite), TailwindCSS, Framer Motion
- **Backend:** Node.js + Express.js (REST API)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT (access + refresh tokens), bcrypt for password hashing
- **Email:** Nodemailer (SMTP or SendGrid) for OTP delivery
- **File Storage:** Multer + local disk (or Cloudinary for candidate photos)
- **Session:** Redis (for OTP storage with TTL)
- **Deployment-ready:** Include `.env.example`, Dockerfile optional

---

## DATABASE SCHEMA (Prisma)

Design the following models:

### Institution
- id, name, emailSuffix (e.g. "@bennett.edu.in"), logoUrl (optional), createdAt

### User (Student)
- id, email, passwordHash, votingId (auto-generated unique UUID), institutionId (FK), isVerified (bool), createdAt

### Admin
- id, email, passwordHash, institutionId (FK), isSuperAdmin (bool), createdAt
- SuperAdmin can manage all institutions; regular Admin manages only their institution

### VotingEvent
- id, title (e.g. "President Election — Student Council"), description, institutionId (FK),
  createdBy (Admin FK), startsAt (DateTime), endsAt (DateTime),
  resultsPublished (bool, default false), createdAt

### Candidate
- id, name, photoUrl, bio (optional), position (e.g. "President"),
  votingEventId (FK), createdAt

### Vote
- id, userId (FK), candidateId (FK), votingEventId (FK), castedAt (DateTime)
- Unique constraint: (userId, votingEventId) — one vote per student per event

---

## COLLEGE DATA

Create a seed file `prisma/seed.js` that populates the Institution table with at least 20 Indian colleges including (but not limited to):

| College | Email Suffix |
|---|---|
| Bennett University | @bennett.edu.in |
| Lovely Professional University | @lpu.edu.in |
| Manipal University | @manipal.edu |
| VIT University | @vit.ac.in |
| SRM University | @srmist.edu.in |
| Amity University | @amity.edu |
| Sharda University | @sharda.ac.in |
| Symbiosis | @symbiosis.ac.in |
| Chitkara University | @chitkara.edu.in |
| Chandigarh University | @cumail.in |
| Thapar Institute | @thapar.edu |
| BITS Pilani | @pilani.bits-pilani.ac.in |
| Delhi Technological University | @dtu.ac.in |
| Jamia Millia Islamia | @jmi.ac.in |
| NMIMS University | @nmims.edu |
| Presidency University | @presidencyuniversity.in |
| Christ University | @christuniversity.in |
| Parul University | @paruluniversity.ac.in |
| Graphic Era University | @geu.ac.in |
| Kalinga Institute | @kiit.ac.in |

**Important:** The system must validate that during signup/login, the email suffix matches the selected institution's emailSuffix exactly (case-insensitive).

---

## BACKEND API ROUTES

### AUTH ROUTES (`/api/auth`)

**POST /api/auth/send-otp**
- Body: `{ email, institutionId }`
- Validate email suffix matches institution
- Generate 6-digit OTP, store in Redis with 10-minute TTL
- Send OTP via email
- Return: `{ message: "OTP sent" }`

**POST /api/auth/verify-otp**
- Body: `{ email, otp }`
- Validate OTP from Redis
- Return: `{ message: "OTP verified", tempToken }` (short-lived JWT to allow password creation)

**POST /api/auth/signup**
- Body: `{ email, password, tempToken }`
- Validate tempToken
- Hash password, create user, generate votingId
- Return: `{ message: "Account created", votingId }`

**POST /api/auth/login**
- Body: `{ email, password }`
- Validate credentials
- Return: `{ accessToken, refreshToken, user: { name, email, votingId, institutionId } }`

**POST /api/auth/admin/login**
- Separate admin login endpoint
- Returns admin JWT with role embedded

**POST /api/auth/refresh**
- Rotate refresh token

---

### INSTITUTION ROUTES (`/api/institutions`)

**GET /api/institutions**
- Public route — returns list of all institutions (id, name, emailSuffix)
- Used for the dropdown on the landing page

---

### VOTING EVENT ROUTES (`/api/events`)

**GET /api/events** *(Student, authenticated)*
- Returns all voting events for the student's institution
- For each event, include:
  - Status: `upcoming` | `active` | `closed` | `results_published`
  - If `results_published = true`, include winner details:
    - `winnerName`, `winnerPhoto`, `votePercentage`, `totalVotes`
  - If student has already voted in this event, include `hasVoted: true`

**GET /api/events/:eventId** *(Student, authenticated)*
- Returns full event detail with all candidates
- Include `hasVoted` flag and `votedCandidateId` if applicable

**POST /api/events/:eventId/vote** *(Student, authenticated)*
- Body: `{ candidateId }`
- Validate: event is active, student hasn't voted, candidate belongs to this event
- Record vote
- Return: `{ message: "Vote cast successfully", receipt: { votingId, candidateId, eventTitle, timestamp } }`

---

### ADMIN ROUTES (`/api/admin`) — All require Admin JWT

**GET /api/admin/events** — List all events for admin's institution

**POST /api/admin/events** — Create new voting event
- Body: `{ title, description, startsAt, endsAt }`

**PUT /api/admin/events/:eventId** — Edit event (only if voting hasn't started)

**DELETE /api/admin/events/:eventId** — Delete event (only if no votes cast)

**POST /api/admin/events/:eventId/candidates** — Add candidate
- Multipart form: `{ name, bio, position, photo (file) }`

**DELETE /api/admin/events/:eventId/candidates/:candidateId** — Remove candidate

**POST /api/admin/events/:eventId/publish-results** — Publish results
- Sets `resultsPublished = true`
- Triggers result calculation (aggregate votes per candidate, find winner)
- Results become visible to students on the hero page

**GET /api/admin/events/:eventId/stats** — Live vote counts per candidate (before publishing)

---

## FRONTEND — PAGE STRUCTURE

### 1. LANDING PAGE (`/`)

**Institution Selector Page**

Design: Full dark screen. Center-aligned. Minimal.

- Large heading: `"CampusVote"` in white, thin weight font
- Subheading: `"Democratic elections for your campus"` in grey
- A search-enabled dropdown (combobox) for institution selection:
  - User can type to filter
  - Shows institution name in dropdown
  - On selection → redirect to `/login?institution=<institutionId>`
- Bottom text: `"Secure · Transparent · Student-Led"` in muted grey

---

### 2. LOGIN PAGE (`/login`)

**Design:** Centered card on dark background. Bento-inspired card with subtle border.

Components:
- Institution badge at top (shows selected institution name)
- Email input: `"Enter your college email"` with placeholder showing correct suffix (e.g. `yourname@bennett.edu.in`)
  - Validate suffix on blur — show inline error if wrong
- Password input
- `"Login"` button (white on dark, full width)
- `"New here? Create account"` link → goes to `/signup`
- `"Admin Login"` link at bottom in small muted text → goes to `/admin/login`

---

### 3. SIGNUP PAGE (`/signup`)

**Multi-step flow (3 steps, show progress indicator):**

**Step 1 — Email**
- College email input with suffix validation
- `"Send OTP"` button
- On success → move to Step 2

**Step 2 — OTP Verification**
- 6-box OTP input (individual digit boxes, auto-focus next)
- Countdown timer (10:00 minutes)
- `"Resend OTP"` option after 60 seconds
- On success → move to Step 3

**Step 3 — Set Password**
- Password input (min 8 chars, show strength indicator)
- Confirm password input
- `"Create Account"` button
- On success → show Voting ID in a styled card, then redirect to `/login` after 5 seconds

---

### 4. HERO PAGE / DASHBOARD (`/dashboard`)

**Design Language:** Dark background (#0a0a0a), bento grid layout, cards with subtle #1a1a1a fill and 1px #2a2a2a border.

**Header:**
- Left: `CampusVote` logo + Institution name
- Right: User avatar circle with initials + Voting ID (truncated) + Logout

**Events Grid (Bento Layout):**

Cards are arranged in a responsive CSS grid (2-col on desktop, 1-col on mobile). Cards vary in visual weight based on status.

**Card States:**

Active Event Card:
```
┌─────────────────────────────────┐
│  LIVE NOW               [VOTE →]│
│                                 │
│  President Election             │
│  Student Council                │
│                                 │
│  Closes: Dec 28, 2025 · 11:59PM │
│  ████░░░░░░ 43% participated    │
└─────────────────────────────────┘
```

Already Voted Card:
```
┌─────────────────────────────────┐
│  YOU VOTED                      │
│                                 │
│  COO Election                   │
│  Uphoria Fest Management        │
│                                 │
│  Results pending...             │
└─────────────────────────────────┘
```

Results Published Card:
```
┌─────────────────────────────────┐
│  RESULTS                        │
│                                 │
│  Ram Kumar                      │
│  67% · 1,204 votes              │
│  ████████░░ WINNER              │
│                                 │
│  President Election             │
│  Student Council                │
└─────────────────────────────────┘
```

Upcoming Event Card:
```
┌─────────────────────────────────┐
│  UPCOMING                       │
│                                 │
│  Secretary Election             │
│  Cultural Committee             │
│                                 │
│  Opens: Jan 5, 2026             │
└─────────────────────────────────┘
```

Use subtle color accents:
- Active: green accent (#22c55e) glow on border
- Results: amber/gold (#f59e0b) for winner highlight
- Upcoming: grey muted
- Voted: blue accent (#3b82f6)

---

### 5. VOTING PAGE (`/dashboard/events/:eventId`)

**Layout:** Dark background, centered content, max-width container.

**Top Section:**
- Back button
- Event title, description, closing time (countdown timer if active)
- If `hasVoted`: show banner `"You have already cast your vote in this election"` — disable all vote buttons

**Candidates Grid:**

Cards in 2-3 column grid:
```
┌──────────────────┐
│   [PHOTO]        │
│   Candidate Name │
│   Position       │
│   Short bio      │
│                  │
│  [ Cast Vote ]   │
└──────────────────┘
```

- Photo: rounded square, 120x120px
- If no photo uploaded: show initials avatar
- Vote button: outlined style by default → on hover, fills white

**Vote Confirmation Modal:**

When student clicks Cast Vote:
- Overlay modal appears
- Shows candidate photo + name
- Text: `"You are about to cast your vote for [Name]. This action cannot be undone."`
- Two buttons: `"Cancel"` (outlined) and `"Confirm Vote"` (filled white)
- After confirmation: show success animation (checkmark), then redirect back to dashboard

---

### 6. ADMIN LOGIN PAGE (`/admin/login`)

Identical design to student login. Differentiated by:
- Badge: `"Admin Portal"` in amber/gold
- No signup option

---

### 7. ADMIN DASHBOARD (`/admin`)

**Layout:** Sidebar nav (collapsible on mobile) + main content area. All dark.

**Sidebar Items:**
- Events
- Candidates
- Results Control
- Settings

**Events Tab:**

Table or bento-grid list of all events with:
- Title, Status badge, Start/End dates, Vote count, Candidates count
- Action buttons: Edit | Delete | View Stats | Publish Results

**Create/Edit Event Modal:**
- Title, Description (textarea)
- Start datetime picker, End datetime picker
- Save button

**Candidates Tab (per event):**

Grid of existing candidates with:
- Photo preview, Name, Bio, Position
- Delete button

Upload form below:
- Name input, Bio textarea, Position input
- Photo upload (drag-and-drop area + preview)
- `"Add Candidate"` button

**Results Control Tab:**

List of closed events (endsAt in the past) with:
- `"Preview Results"` — shows vote counts privately to admin
- `"Publish Results"` — makes results visible to students on hero page
- Cannot unpublish once published (show warning before confirming)

**Stats Modal (per event):**

Live bar chart showing:
- Candidate name | votes count | percentage bar
- Total participation count
- Refresh button (poll every 30s while event is active)

---

## DESIGN SYSTEM

### Color Palette
```css
--bg-primary: #0a0a0a;
--bg-card: #111111;
--bg-card-hover: #1a1a1a;
--border-default: #2a2a2a;
--border-hover: #3a3a3a;
--text-primary: #f5f5f5;
--text-secondary: #a1a1aa;
--text-muted: #52525b;
--accent-green: #22c55e;
--accent-blue: #3b82f6;
--accent-amber: #f59e0b;
--accent-red: #ef4444;
--white: #ffffff;
```

### Typography
- Font: `Inter` (Google Fonts)
- Headings: 600–700 weight
- Body: 400 weight
- All caps labels: `tracking-widest`, 11px, muted color

### Card Style
```css
background: #111111;
border: 1px solid #2a2a2a;
border-radius: 12px;
padding: 20px;
transition: border-color 0.2s ease;
/* hover: border-color: #3a3a3a */
```

### Bento Grid
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 16px;
```

---

## SECURITY REQUIREMENTS

1. **Email suffix validation** must happen on BOTH frontend (real-time) and backend (on every auth endpoint)
2. **OTP** must be hashed before storing in Redis (use SHA-256)
3. **One vote per event** enforced by DB unique constraint AND checked in API before insert
4. **JWT expiry:** Access token = 15 minutes, Refresh token = 7 days
5. **Admin routes** must be protected by middleware that checks `role: "admin"` in JWT
6. **Rate limiting:** Apply `express-rate-limit` on `/api/auth/send-otp` (max 3 per email per hour) and `/api/auth/login` (max 10 per IP per 15 minutes)
7. **Votes are immutable:** Once cast, no API route should allow deletion or modification of vote records
8. **Results visibility:** Vote counts are never exposed to students until admin explicitly publishes results

---

## VOTING ID FORMAT

- Auto-generated on signup using UUID v4
- Format: `CV-<INSTITUTION_CODE>-<RANDOM_8_CHARS>` e.g. `CV-BNT-A3F7K2PQ`
- Shown to student after signup and in their profile
- Used as a human-readable receipt identifier

---

## FOLDER STRUCTURE

```
campusvote/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validate.js
│   │   ├── services/
│   │   │   ├── emailService.js
│   │   │   └── otpService.js
│   │   ├── utils/
│   │   └── app.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EventDetail.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       └── AdminDashboard.jsx
│   │   ├── components/
│   │   │   ├── EventCard.jsx
│   │   │   ├── CandidateCard.jsx
│   │   │   ├── VoteConfirmModal.jsx
│   │   │   ├── OTPInput.jsx
│   │   │   ├── InstitutionSelect.jsx
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── api/
│   │   │   └── axiosInstance.js
│   │   └── App.jsx
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## ADDITIONAL IMPLEMENTATION NOTES

1. **Searchable dropdown on landing page:** Use `react-select` or build a custom combobox. It must support typing to filter colleges. Pre-fetch the full institution list on page load.

2. **OTP input component:** 6 individual input boxes. On paste, auto-fill all boxes. Auto-advance cursor to next box on each digit entered. On backspace, go to previous box.

3. **Vote receipt:** After voting, show a receipt card with:
   - Voting ID
   - Event name
   - Timestamp
   - Note: `"Your vote has been securely recorded. Keep this as proof."`

4. **Results calculation:** On `publish-results`, backend should:
   - Count votes per candidate
   - Calculate percentage
   - Identify winner (highest votes; in case of tie, mark both as co-winners)
   - Store winner metadata in VotingEvent or a ResultSnapshot table

5. **Admin — SuperAdmin distinction:**
   - SuperAdmin (created via seed or CLI command) can manage all institutions and create regular admins
   - Regular Admin can only manage events and candidates for their own institution

6. **Error handling:** All API errors must return consistent JSON: `{ error: true, message: "...", code: "..." }`

7. **Loading states:** Every data fetch must have a skeleton loader that matches the card layout (dark skeleton shimmer effect).

8. **Empty states:** If no events exist for an institution, show: `"No elections scheduled yet. Check back later."` with a subtle icon.

9. **Mobile responsiveness:** All pages must be fully responsive. Bento grid collapses to single column on mobile. Sidebar in admin becomes a hamburger menu on mobile.

10. **README.md:** Include full setup instructions — env vars required, how to seed the DB, how to run dev servers, how to create the first SuperAdmin account.

---

## HOW TO START

Build in this order:
1. Set up the folder structure and install dependencies
2. Write the Prisma schema and seed file
3. Build the backend API (auth first, then events, then admin)
4. Build the frontend pages in order: Landing → Login → Signup → Dashboard → Voting Page → Admin
5. Wire frontend to backend via axios
6. Write the README

Build this completely and make sure everything is wired together and functional.
