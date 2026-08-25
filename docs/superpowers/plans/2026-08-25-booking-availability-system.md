# Booking Availability System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Pak. Lee's Car a date-based booking availability calendar: a public read-only calendar on the homepage showing how many people are already booked per date/route, and a password-protected admin page where Pak Lee registers/edits/deletes bookings.

**Architecture:** The site stays a static HTML file deployed on Vercel; this plan adds a `bookings` table in a new Supabase (Postgres) project, three Vercel serverless functions under `/api` that read/write it, and two new front-end pieces: a calendar widget injected into `index.html`'s existing `#shared-calendar-{route}` placeholders, and a new standalone `admin.html` page.

**Tech Stack:** Vercel serverless functions (Node.js, `@vercel/node` runtime), Supabase (`@supabase/supabase-js`), vanilla JS/HTML/CSS on the front end. No frameworks.

**Spec:** `docs/superpowers/specs/2026-08-25-shared-tours-booking-design.md` (Section B)

**Depends on:** `docs/superpowers/plans/2026-08-25-shared-tour-content.md` must be applied first — this plan renders into the `#shared-calendar-seoul` / `-nami` / `-dmz` placeholders that plan creates.

## Global Constraints

- Routes are always one of exactly 3 values: `seoul`, `nami`, `dmz` (matches the 3 cards from the content plan).
- Minimum 4 pax = "confirmed" status; 0 < pax < 4 = "pending"; pax >= 8 = "full" (Staria seats 8 max).
- The public API never exposes raw booking rows (names/notes) — only per-date aggregated pax totals and status. Only the admin API (token-protected) exposes raw rows.
- No session store: the admin token is a daily HMAC of `ADMIN_PASSWORD`, verified statelessly on every request, so it naturally expires at UTC day rollover.
- Do not test any code path against real customer data — use invented dummy dates/pax values, matching the project's existing rule against verifying against live user data.

---

### Task 1: Supabase project and `bookings` table (manual setup)

**Files:** none (external service configuration) — produces environment variable values needed by every later task.

**Interfaces:**
- Produces: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` — three secrets that Task 2 wires into Vercel.

- [ ] **Step 1: Create the Supabase project**

Go to https://supabase.com, sign in, create a new project (any name, e.g. "pakleecar-bookings", any region close to Korea e.g. Northeast Asia). Wait for provisioning to finish.

- [ ] **Step 2: Create the `bookings` table**

In the Supabase dashboard, open the SQL Editor and run:

```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  tour_date date not null,
  route text not null check (route in ('seoul', 'nami', 'dmz')),
  pax integer not null check (pax >= 1),
  note text,
  created_at timestamptz not null default now()
);

create index bookings_route_date_idx on bookings (route, tour_date);

alter table bookings enable row level security;
-- No policies are created: with RLS enabled and zero policies, the anon/public
-- key has NO access at all. Only the service_role key (used server-side only,
-- never shipped to the browser) can read/write. This is intentional — the
-- public calendar and the admin page both go through our own /api endpoints,
-- never talk to Supabase directly.
```

- [ ] **Step 3: Collect the credentials**

In Supabase dashboard → Project Settings → API:
- Copy the "Project URL" → this is `SUPABASE_URL`
- Copy the "service_role" secret key (NOT the "anon" public key) → this is `SUPABASE_SERVICE_ROLE_KEY`

Pick a strong password for Pak Lee's admin page → this is `ADMIN_PASSWORD` (write it down somewhere safe; it will be typed into the admin page later).

- [ ] **Step 4: Verify the table exists**

In Supabase dashboard → Table Editor, confirm `bookings` appears with columns `id, tour_date, route, pax, note, created_at` and RLS shows as "Enabled".

No commit for this task (no files changed in the repo).

---

### Task 2: Project dependency and shared server-side libraries

**Files:**
- Create: `F:\pakleecar\package.json`
- Create: `F:\pakleecar\lib\supabase.js`
- Create: `F:\pakleecar\lib\auth.js`
- Create: `F:\pakleecar\.gitignore` (append `node_modules`)

**Interfaces:**
- Produces: `getSupabase()` from `lib/supabase.js` returning a configured Supabase client; `makeToken(password)` and `verifyToken(token, password)` from `lib/auth.js`.
- Consumes: env vars `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` (set in Task 1, wired into Vercel in Task 6).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "pakleecar",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore` (or append if it already exists)**

```
node_modules
.vercel
```

- [ ] **Step 3: Install dependencies locally**

Run: `cd F:/pakleecar && npm install`
Expected: `node_modules/@supabase/supabase-js` exists, `package-lock.json` is created.

- [ ] **Step 4: Create `lib/supabase.js`**

```js
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

module.exports = { getSupabase };
```

- [ ] **Step 5: Create `lib/auth.js`**

```js
const crypto = require('crypto');

function todayStamp() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

function makeToken(password) {
  return crypto.createHmac('sha256', password).update(todayStamp()).digest('hex');
}

function verifyToken(token, password) {
  if (!token || typeof token !== 'string') return false;
  const expected = makeToken(password);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { makeToken, verifyToken };
```

- [ ] **Step 6: Verify with a throwaway Node script**

Run:
```bash
cd F:/pakleecar
node -e "
const { makeToken, verifyToken } = require('./lib/auth');
const t = makeToken('secret123');
console.log('token:', t);
console.log('verify correct:', verifyToken(t, 'secret123'));
console.log('verify wrong password:', verifyToken(t, 'nope'));
console.log('verify garbage token:', verifyToken('not-a-real-token', 'secret123'));
"
```
Expected output: a 64-char hex token, then `verify correct: true`, `verify wrong password: false`, `verify garbage token: false`.

- [ ] **Step 7: Commit**

```bash
cd F:/pakleecar
git add package.json .gitignore lib/supabase.js lib/auth.js
git commit -m "feat: add Supabase client and stateless admin-token auth helpers"
```

(`package-lock.json` and `node_modules` — add the lockfile too, skip `node_modules` since it's gitignored: `git add package-lock.json` then amend into the same commit before committing, i.e. include it in the `git add` list above.)

---

### Task 3: `POST /api/login` — admin login endpoint

**Files:**
- Create: `F:\pakleecar\api\login.js`

**Interfaces:**
- Consumes: `makeToken` from `lib/auth.js`
- Produces: `POST /api/login` returning `{ token }` on success — consumed by `admin.html` in Task 7.

- [ ] **Step 1: Create `api/login.js`**

```js
const { makeToken } = require('../lib/auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const password = req.body && req.body.password;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  res.status(200).json({ token: makeToken(process.env.ADMIN_PASSWORD) });
};
```

- [ ] **Step 2: Install the Vercel CLI and run the dev server**

Run: `npm install -g vercel` (skip if already installed), then from `F:/pakleecar`:
```bash
vercel dev
```
On first run it asks to link/create a project — accept defaults. It will prompt you can't set env vars interactively for `vercel dev` easily; instead create `F:\pakleecar\.env.local`:
```
SUPABASE_URL=<value from Task 1>
SUPABASE_SERVICE_ROLE_KEY=<value from Task 1>
ADMIN_PASSWORD=<value you picked in Task 1>
```
Add `.env.local` to `.gitignore` (append it — never commit secrets):
```
node_modules
.vercel
.env.local
```
Restart `vercel dev` after creating `.env.local` so it picks up the variables. Note the local URL it prints (typically `http://localhost:3000`).

- [ ] **Step 3: Verify the login endpoint manually**

With `vercel dev` running, in a second terminal:
```bash
curl -s -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d "{\"password\":\"wrong\"}"
```
Expected: `{"error":"Invalid password"}` with HTTP 401.

```bash
curl -s -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d "{\"password\":\"<your real ADMIN_PASSWORD>\"}"
```
Expected: `{"token":"<64 hex chars>"}` with HTTP 200.

- [ ] **Step 4: Commit**

```bash
cd F:/pakleecar
git add api/login.js .gitignore
git commit -m "feat: add admin login API endpoint"
```

---

### Task 4: `GET /api/bookings` — public aggregated availability

**Files:**
- Create: `F:\pakleecar\api\bookings.js`

**Interfaces:**
- Consumes: `getSupabase` from `lib/supabase.js`
- Produces: `GET /api/bookings?route=<seoul|nami|dmz>&month=<YYYY-MM>` returning `{ days: [{ date, pax, status }] }` — consumed by the calendar widget in Task 8.

- [ ] **Step 1: Create `api/bookings.js`**

```js
const { getSupabase } = require('../lib/supabase');

const ROUTES = ['seoul', 'nami', 'dmz'];

function statusFor(pax) {
  if (pax >= 8) return 'full';
  if (pax >= 4) return 'confirmed';
  return 'pending';
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { route, month } = req.query;
  if (!ROUTES.includes(route) || !/^\d{4}-\d{2}$/.test(month || '')) {
    res.status(400).json({ error: 'route (seoul|nami|dmz) and month (YYYY-MM) are required' });
    return;
  }

  const [year, monthNum] = month.split('-').map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select('tour_date, pax')
    .eq('route', route)
    .gte('tour_date', from)
    .lte('tour_date', to);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const totals = {};
  for (const row of data) {
    totals[row.tour_date] = (totals[row.tour_date] || 0) + row.pax;
  }
  const days = Object.keys(totals)
    .sort()
    .map((date) => ({ date, pax: totals[date], status: statusFor(totals[date]) }));

  res.status(200).json({ days });
};
```

- [ ] **Step 2: Verify with dummy data**

Insert a dummy row via Supabase SQL Editor (use a near-future date, NOT a real booking):
```sql
insert into bookings (tour_date, route, pax, note) values ('2026-09-15', 'nami', 3, 'TEST DUMMY - delete me');
insert into bookings (tour_date, route, pax, note) values ('2026-09-15', 'nami', 2, 'TEST DUMMY - delete me');
```

With `vercel dev` running:
```bash
curl -s "http://localhost:3000/api/bookings?route=nami&month=2026-09"
```
Expected: `{"days":[{"date":"2026-09-15","pax":5,"status":"confirmed"}]}` (5 = 3+2, status "confirmed" since 4 <= 5 < 8).

```bash
curl -s "http://localhost:3000/api/bookings?route=seoul&month=2026-09"
```
Expected: `{"days":[]}` (no bookings for that route/month).

```bash
curl -s "http://localhost:3000/api/bookings?route=bogus&month=2026-09"
```
Expected: HTTP 400 with an error message.

- [ ] **Step 3: Commit**

```bash
cd F:/pakleecar
git add api/bookings.js
git commit -m "feat: add public aggregated availability API"
```

---

### Task 5: Admin CRUD API — `/api/admin-bookings` and `/api/admin-bookings/[id]`

**Files:**
- Create: `F:\pakleecar\api\admin-bookings.js`
- Create: `F:\pakleecar\api\admin-bookings\[id].js`

**Interfaces:**
- Consumes: `getSupabase` from `lib/supabase.js`, `verifyToken` from `lib/auth.js`
- Produces: `GET/POST /api/admin-bookings` (list all future bookings / create), `PUT/DELETE /api/admin-bookings/:id` (update/delete) — all requiring header `x-admin-token`. Consumed by `admin.html` in Task 7.

- [ ] **Step 1: Create `api/admin-bookings.js`**

```js
const { getSupabase } = require('../lib/supabase');
const { verifyToken } = require('../lib/auth');

const ROUTES = ['seoul', 'nami', 'dmz'];

module.exports = async (req, res) => {
  if (!verifyToken(req.headers['x-admin-token'], process.env.ADMIN_PASSWORD)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, tour_date, route, pax, note, created_at')
      .order('tour_date', { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ bookings: data });
    return;
  }

  if (req.method === 'POST') {
    const { tour_date, route, pax, note } = req.body || {};
    if (!tour_date || !ROUTES.includes(route) || !Number.isInteger(pax) || pax < 1) {
      res.status(400).json({ error: 'tour_date, route (seoul|nami|dmz), pax (positive integer) are required' });
      return;
    }
    const { data, error } = await supabase
      .from('bookings')
      .insert({ tour_date, route, pax, note: note || null })
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ booking: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
```

- [ ] **Step 2: Create `api/admin-bookings/[id].js`**

```js
const { getSupabase } = require('../../lib/supabase');
const { verifyToken } = require('../../lib/auth');

const ROUTES = ['seoul', 'nami', 'dmz'];

module.exports = async (req, res) => {
  if (!verifyToken(req.headers['x-admin-token'], process.env.ADMIN_PASSWORD)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.query;
  const supabase = getSupabase();

  if (req.method === 'PUT') {
    const { tour_date, route, pax, note } = req.body || {};
    if (!tour_date || !ROUTES.includes(route) || !Number.isInteger(pax) || pax < 1) {
      res.status(400).json({ error: 'tour_date, route (seoul|nami|dmz), pax (positive integer) are required' });
      return;
    }
    const { data, error } = await supabase
      .from('bookings')
      .update({ tour_date, route, pax, note: note || null })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ booking: data });
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
```

- [ ] **Step 3: Verify all 4 operations manually**

With `vercel dev` running, get a fresh token first:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d "{\"password\":\"<ADMIN_PASSWORD>\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo $TOKEN
```

Create:
```bash
curl -s -X POST http://localhost:3000/api/admin-bookings -H "Content-Type: application/json" -H "x-admin-token: $TOKEN" -d "{\"tour_date\":\"2026-09-20\",\"route\":\"seoul\",\"pax\":2,\"note\":\"TEST DUMMY\"}"
```
Expected: HTTP 201 with the created row including an `id`.

List (copy the `id` from the response above):
```bash
curl -s http://localhost:3000/api/admin-bookings -H "x-admin-token: $TOKEN"
```
Expected: HTTP 200, `bookings` array includes the row just created.

Update:
```bash
curl -s -X PUT http://localhost:3000/api/admin-bookings/<id> -H "Content-Type: application/json" -H "x-admin-token: $TOKEN" -d "{\"tour_date\":\"2026-09-20\",\"route\":\"seoul\",\"pax\":5,\"note\":\"TEST DUMMY updated\"}"
```
Expected: HTTP 200, `pax` is now 5.

Delete:
```bash
curl -s -X DELETE http://localhost:3000/api/admin-bookings/<id> -H "x-admin-token: $TOKEN"
```
Expected: HTTP 204, no body.

No-token check:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin-bookings
```
Expected: `401`.

- [ ] **Step 4: Commit**

```bash
cd F:/pakleecar
git add api/admin-bookings.js "api/admin-bookings/[id].js"
git commit -m "feat: add token-protected admin CRUD API for bookings"
```

---

### Task 6: Wire environment variables into Vercel

**Files:** none (Vercel project configuration)

- [ ] **Step 1: Add the 3 environment variables to the Vercel project**

Run (from `F:/pakleecar`, after `vercel dev` has linked the project in Task 3):
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ADMIN_PASSWORD production
```
Paste the corresponding value from Task 1 at each prompt. Repeat with `preview` and `development` instead of `production` if you want the same values available on preview deployments (recommended, so `vercel dev`/preview branches work identically).

- [ ] **Step 2: Verify**

Run: `vercel env ls`
Expected: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` all listed for the environments you added them to.

No commit for this task (no files changed in the repo).

---

### Task 7: Admin page (`admin.html`)

**Files:**
- Create: `F:\pakleecar\admin.html`

**Interfaces:**
- Consumes: `POST /api/login`, `GET/POST /api/admin-bookings`, `PUT/DELETE /api/admin-bookings/:id`
- Produces: a standalone page for Pak Lee to manage bookings, not linked from the public nav (accessed by direct URL only, e.g. `pakleecar.vercel.app/admin.html`)

- [ ] **Step 1: Create `admin.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pak Lee's Car — Admin</title>
<meta name="robots" content="noindex, nofollow">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:sans-serif;background:#F3F4F6;color:#1F2937;padding:2rem 1rem}
.wrap{max-width:900px;margin:0 auto}
h1{margin-bottom:1.5rem}
.card{background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.08);margin-bottom:1.5rem}
label{display:block;font-size:.85rem;font-weight:600;margin-bottom:.3rem;margin-top:.8rem}
input,select{width:100%;padding:.6rem;border:1px solid #E5E7EB;border-radius:8px;font-size:.95rem}
button{margin-top:1rem;background:#E8640A;color:#fff;border:none;border-radius:8px;padding:.7rem 1.2rem;font-weight:700;cursor:pointer}
button.danger{background:#DC2626}
button.secondary{background:#6B7280}
table{width:100%;border-collapse:collapse;margin-top:1rem;font-size:.88rem}
th,td{padding:.5rem;text-align:left;border-bottom:1px solid #F3F4F6}
.err{color:#DC2626;font-size:.85rem;margin-top:.5rem}
.hidden{display:none}
.row-actions button{margin:0 .2rem 0 0;padding:.3rem .6rem;font-size:.8rem}
</style>
</head>
<body>
<div class="wrap">
  <h1>Pak Lee's Car — Booking Admin</h1>

  <div class="card" id="loginCard">
    <label for="password">Password</label>
    <input type="password" id="password">
    <button onclick="login()">Login</button>
    <div class="err hidden" id="loginErr">Invalid password.</div>
  </div>

  <div id="appCard" class="hidden">
    <div class="card">
      <h2>Add booking</h2>
      <label for="f-date">Date</label>
      <input type="date" id="f-date">
      <label for="f-route">Route</label>
      <select id="f-route">
        <option value="seoul">Seoul</option>
        <option value="nami">Nami Island</option>
        <option value="dmz">DMZ</option>
      </select>
      <label for="f-pax">Pax</label>
      <input type="number" id="f-pax" min="1" value="1">
      <label for="f-note">Note (customer name / phone, optional)</label>
      <input type="text" id="f-note">
      <button onclick="createBooking()">Add</button>
      <div class="err hidden" id="createErr"></div>
    </div>

    <div class="card">
      <h2>All bookings</h2>
      <table>
        <thead><tr><th>Date</th><th>Route</th><th>Pax</th><th>Note</th><th></th></tr></thead>
        <tbody id="bookingsBody"></tbody>
      </table>
    </div>

    <button class="secondary" onclick="logout()">Logout</button>
  </div>
</div>

<script>
function getToken() { return sessionStorage.getItem('adminToken'); }
function setToken(t) { sessionStorage.setItem('adminToken', t); }
function clearToken() { sessionStorage.removeItem('adminToken'); }

async function login() {
  document.getElementById('loginErr').classList.add('hidden');
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    document.getElementById('loginErr').classList.remove('hidden');
    return;
  }
  const { token } = await res.json();
  setToken(token);
  showApp();
}

function logout() {
  clearToken();
  document.getElementById('appCard').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

async function showApp() {
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('appCard').classList.remove('hidden');
  await loadBookings();
}

async function loadBookings() {
  const res = await fetch('/api/admin-bookings', { headers: { 'x-admin-token': getToken() } });
  if (res.status === 401) { logout(); return; }
  const { bookings } = await res.json();
  const body = document.getElementById('bookingsBody');
  body.innerHTML = '';
  for (const b of bookings) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.tour_date}</td>
      <td>${b.route}</td>
      <td>${b.pax}</td>
      <td>${b.note || ''}</td>
      <td class="row-actions">
        <button onclick="deleteBooking('${b.id}')" class="danger">Delete</button>
      </td>
    `;
    body.appendChild(tr);
  }
}

async function createBooking() {
  document.getElementById('createErr').classList.add('hidden');
  const tour_date = document.getElementById('f-date').value;
  const route = document.getElementById('f-route').value;
  const pax = parseInt(document.getElementById('f-pax').value, 10);
  const note = document.getElementById('f-note').value;
  const res = await fetch('/api/admin-bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
    body: JSON.stringify({ tour_date, route, pax, note })
  });
  if (res.status === 401) { logout(); return; }
  if (!res.ok) {
    const { error } = await res.json();
    const el = document.getElementById('createErr');
    el.textContent = error;
    el.classList.remove('hidden');
    return;
  }
  document.getElementById('f-date').value = '';
  document.getElementById('f-pax').value = '1';
  document.getElementById('f-note').value = '';
  await loadBookings();
}

async function deleteBooking(id) {
  if (!confirm('Delete this booking?')) return;
  const res = await fetch('/api/admin-bookings/' + id, {
    method: 'DELETE',
    headers: { 'x-admin-token': getToken() }
  });
  if (res.status === 401) { logout(); return; }
  await loadBookings();
}

if (getToken()) showApp();
</script>
</body>
</html>
```

- [ ] **Step 2: Verify manually in a browser**

With `vercel dev` running, open `http://localhost:3000/admin.html`.

Check:
- Entering the wrong password shows "Invalid password."
- Entering the correct `ADMIN_PASSWORD` logs in and shows the "Add booking" form and an (empty or dummy-populated) table.
- Adding a booking (e.g. date 2026-09-25, route `dmz`, pax 4, note "TEST DUMMY") appears in the table immediately.
- Clicking "Delete" on that row removes it after confirming the browser `confirm()` dialog.
- Reloading the page while logged in (token still in `sessionStorage`) skips the login form and goes straight to the table.
- Closing the tab and reopening `admin.html` in a fresh tab (new `sessionStorage`) shows the login form again.

- [ ] **Step 3: Commit**

```bash
cd F:/pakleecar
git add admin.html
git commit -m "feat: add password-protected admin page for managing bookings"
```

---

### Task 8: Public calendar widget on the homepage

**Files:**
- Modify: `F:\pakleecar\index.html` — add CSS (append after the `.shared-min-note` rule added by the content plan), add a `<template>`-free JS module near the bottom `<script>` block, and call it once per route into the three placeholder divs.

**Interfaces:**
- Consumes: `GET /api/bookings?route=&month=` (Task 4), the three `#shared-calendar-seoul` / `-nami` / `-dmz` divs (created by `2026-08-25-shared-tour-content.md` Task 4)
- Produces: nothing further consumed by other tasks — this is the last task in the plan.

- [ ] **Step 1: Add calendar CSS**

Locate the `.shared-min-note` rule added by the content plan (in `<style>`, inside the `/* ── SHARED TOUR ── */` block) and add these rules right after it:

old_string:
```css
.shared-min-note{font-size:.72rem;color:var(--gray);margin-top:.5rem;font-style:italic}
```

new_string:
```css
.shared-min-note{font-size:.72rem;color:var(--gray);margin-top:.5rem;font-style:italic}
.mini-cal{margin-top:1rem;border-top:1px solid #F3F4F6;padding-top:1rem}
.mini-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;font-size:.82rem;font-weight:700;color:var(--navy);font-family:'Poppins',sans-serif}
.mini-cal-head button{background:var(--gray-light);border:none;border-radius:6px;width:24px;height:24px;cursor:pointer;font-size:.8rem}
.mini-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:.68rem;text-align:center}
.mini-cal-grid .dow{color:var(--gray);font-weight:600;padding-bottom:.25rem}
.mini-cal-day{padding:.35rem 0;border-radius:6px;cursor:default;position:relative}
.mini-cal-day.empty{visibility:hidden}
.mini-cal-day.pending{background:#FFFBEB;color:#92400E}
.mini-cal-day.confirmed{background:#F0FDF4;color:#166534;cursor:pointer}
.mini-cal-day.full{background:#FEF2F2;color:#991B1B}
.mini-cal-day .n{display:block;font-weight:700}
.mini-cal-legend{display:flex;gap:.75rem;font-size:.68rem;color:var(--gray);margin-top:.5rem;flex-wrap:wrap}
.mini-cal-legend span{display:inline-flex;align-items:center;gap:.25rem}
.mini-cal-legend i{width:9px;height:9px;border-radius:2px;display:inline-block}
```

- [ ] **Step 2: Add the calendar-rendering JS**

Locate the end of the `<script>` block, right before the closing `// ── SCROLL REVEAL ──` comment block (which is the last block in the file), and insert this new block right before it:

old_string:
```javascript
// ── SCROLL REVEAL ──
```

new_string:
```javascript
// ── SHARED TOUR CALENDAR ──
const CAL_ROUTES = ['seoul', 'nami', 'dmz'];
const calState = {};
CAL_ROUTES.forEach(r => {
  const now = new Date();
  calState[r] = { year: now.getFullYear(), month: now.getMonth() + 1 }; // month: 1-12
});

function calMonthStr(route) {
  const s = calState[route];
  return `${s.year}-${String(s.month).padStart(2, '0')}`;
}

async function loadCalendar(route) {
  const container = document.getElementById('shared-calendar-' + route);
  if (!container) return;
  const monthStr = calMonthStr(route);
  let days = [];
  try {
    const res = await fetch(`/api/bookings?route=${route}&month=${monthStr}`);
    if (res.ok) {
      const data = await res.json();
      days = data.days || [];
    }
  } catch (e) {
    // Network/API unavailable — render an empty calendar rather than breaking the page.
  }
  renderCalendar(route, monthStr, days);
}

function renderCalendar(route, monthStr, days) {
  const container = document.getElementById('shared-calendar-' + route);
  const byDate = {};
  days.forEach(d => { byDate[d.date] = d; });

  const [year, month] = monthStr.split('-').map(Number);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const dowLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let cellsHtml = dowLabels.map(d => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < firstDow; i++) {
    cellsHtml += '<div class="mini-cal-day empty"></div>';
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const info = byDate[dateStr];
    const statusClass = info ? info.status : '';
    const label = info ? `<span class="n">${info.pax}</span>` : day;
    cellsHtml += `<div class="mini-cal-day ${statusClass}" data-date="${dateStr}" data-route="${route}" onclick="calDayClick(this)">${label || day}</div>`;
  }

  container.innerHTML = `
    <div class="mini-cal">
      <div class="mini-cal-head">
        <button onclick="calNav('${route}', -1)">‹</button>
        <span>${monthStr}</span>
        <button onclick="calNav('${route}', 1)">›</button>
      </div>
      <div class="mini-cal-grid">${cellsHtml}</div>
      <div class="mini-cal-legend">
        <span><i style="background:#F0FDF4;border:1px solid #86EFAC"></i>Confirmed</span>
        <span><i style="background:#FFFBEB;border:1px solid #FCD34D"></i>Pending (&lt;4)</span>
        <span><i style="background:#FEF2F2;border:1px solid #FCA5A5"></i>Full</span>
      </div>
    </div>
  `;
}

function calNav(route, delta) {
  const s = calState[route];
  s.month += delta;
  if (s.month < 1) { s.month = 12; s.year -= 1; }
  if (s.month > 12) { s.month = 1; s.year += 1; }
  loadCalendar(route);
}

function calDayClick(el) {
  const status = el.classList.contains('confirmed') ? 'confirmed'
    : el.classList.contains('full') ? 'full'
    : el.classList.contains('pending') ? 'pending' : null;
  if (!status) return; // empty days aren't clickable
  const date = el.dataset.date;
  const route = el.dataset.route;
  const routeNames = { seoul: 'Seoul Kota', nami: 'Nami Island', dmz: 'DMZ' };
  const msg = `Halo Pak Lee! Saya lihat Share Tour ${routeNames[route]} tanggal ${date} ada rombongan. Boleh info detail & gabung? 🇰🇷`;
  window.open(`https://wa.me/821094157859?text=${encodeURIComponent(msg)}`, '_blank');
}

CAL_ROUTES.forEach(loadCalendar);

// ── SCROLL REVEAL ──
```

- [ ] **Step 3: Verify manually in a browser**

With `vercel dev` running (so `/api/bookings` resolves), open `http://localhost:3000/index.html`.

Check:
- Scroll to the "Share Tour" section — each of the 3 cards shows a small monthly calendar below its price table.
- Any dummy bookings inserted earlier (Task 4's `2026-09-15` Nami test row, if still present) show up as a colored cell with the pax number, once you navigate the Nami calendar to September 2026 using the `‹ ›` buttons.
- Clicking a colored (non-empty) day opens a WhatsApp link mentioning that route and date.
- Clicking an empty (unbooked) day does nothing.
- Opening `index.html` directly as a `file://` URL (not through `vercel dev`) still renders the page without JS errors — the calendars just stay empty (fetch fails silently and `renderCalendar` is called with `days: []`).

- [ ] **Step 4: Clean up dummy test data**

In Supabase SQL Editor, remove every dummy row inserted during this plan's testing:
```sql
delete from bookings where note like 'TEST DUMMY%';
```

- [ ] **Step 5: Commit**

```bash
cd F:/pakleecar
git add index.html
git commit -m "feat: render per-route booking availability calendar on homepage"
```

---

### Task 9: Deploy and final end-to-end verification

**Files:** none

- [ ] **Step 1: Deploy to Vercel production**

Run: `cd F:/pakleecar && vercel --prod`

- [ ] **Step 2: Verify on the live URL**

Open `https://pakleecar.vercel.app/` (or whatever the CLI prints as the production URL):
- Share Tour section shows the 3 route calendars, initially empty (all dummy data was cleaned up in Task 8).
- `https://pakleecar.vercel.app/admin.html` requires the admin password, then lets you add a real or test booking and see it reflected on the public page within a few seconds (refresh).
- Delete any test booking created during this check.

- [ ] **Step 3: No commit needed** (deployment only, no file changes) — this is the final task of the plan.
