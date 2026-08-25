# Shared Tour Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Shared Tour" (셰어투어) section to the Pak. Lee's Car homepage with 3 routes (Seoul city, Nami Island, DMZ), each showing a 10-hour itinerary and a per-headcount price table, and fix the existing DMZ tour card to remove the operationally-impossible JSA stop.

**Architecture:** Single static HTML file (`index.html`), no build step. New section follows the exact patterns already used in the file: `data-id`/`data-en`/`data-th` attributes for the 3-language toggle, `.tour-card`/`.price-table` CSS classes reused, `discussTour()` JS function reused for WhatsApp CTAs.

**Tech Stack:** Plain HTML/CSS/JS, no frameworks, no dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-shared-tours-booking-design.md` (Section A)

## Global Constraints

- Every new user-facing string needs all three `data-id` (Indonesian, default), `data-en` (English), `data-th` (Thai) attributes, exactly like existing content in `index.html`.
- Shared-tour prices are **per team**, not per person (matches how the existing Private Tour pricing table is presented).
- JSA must not appear anywhere in the site — it is operationally incompatible with the flexible private-car model.
- No new CSS class should duplicate existing `.tour-card`/`.price-table`/`.section` styling — reuse it.
- No booking-calendar UI in this plan — that's a separate plan (`2026-08-25-booking-availability-system.md`). This plan only needs to leave a placeholder anchor (`<div id="shared-calendar-{route}"></div>`) inside each card for that later plan to fill in.

---

### Task 1: Fix existing DMZ tour card (remove JSA)

**Files:**
- Modify: `F:\pakleecar\index.html:776-794` (the `<!-- DMZ -->` tour-card block inside `#tours`)

**Interfaces:**
- Consumes: nothing new
- Produces: nothing new (pure content fix)

- [ ] **Step 1: Read the current DMZ card**

The block currently at lines 776-794 has this stop list:
```html
<ul class="tour-stops">
  <li data-id="JSA — Joint Security Area" data-en="JSA — Joint Security Area" data-th="JSA — พื้นที่รักษาความปลอดภัยร่วม">JSA — Joint Security Area</li>
  <li data-id="Tunnel ke-3 (Third Infiltration Tunnel)" data-en="3rd Infiltration Tunnel" data-th="อุโมงค์แทรกซึมที่ 3">Tunnel ke-3 (Third Infiltration Tunnel)</li>
  <li data-id="Dora Observatory (Lihat Korea Utara!)" data-en="Dora Observatory (See North Korea!)" data-th="หอสังเกตการณ์โดรา (มองเห็นเกาหลีเหนือ!)">Dora Observatory (Lihat Korea Utara!)</li>
  <li data-id="Pengalaman yang tidak ada di negara lain" data-en="An experience found nowhere else" data-th="ประสบการณ์ที่หาไม่ได้จากที่ไหน">Pengalaman yang tidak ada di negara lain</li>
</ul>
```

- [ ] **Step 2: Replace the stop list with the corrected itinerary (Imjingak, 3rd Tunnel, Dora Observatory)**

Use the Edit tool with this exact replacement:

old_string:
```html
          <ul class="tour-stops">
            <li data-id="JSA — Joint Security Area" data-en="JSA — Joint Security Area" data-th="JSA — พื้นที่รักษาความปลอดภัยร่วม">JSA — Joint Security Area</li>
            <li data-id="Tunnel ke-3 (Third Infiltration Tunnel)" data-en="3rd Infiltration Tunnel" data-th="อุโมงค์แทรกซึมที่ 3">Tunnel ke-3 (Third Infiltration Tunnel)</li>
            <li data-id="Dora Observatory (Lihat Korea Utara!)" data-en="Dora Observatory (See North Korea!)" data-th="หอสังเกตการณ์โดรา (มองเห็นเกาหลีเหนือ!)">Dora Observatory (Lihat Korea Utara!)</li>
            <li data-id="Pengalaman yang tidak ada di negara lain" data-en="An experience found nowhere else" data-th="ประสบการณ์ที่หาไม่ได้จากที่ไหน">Pengalaman yang tidak ada di negara lain</li>
          </ul>
```

new_string:
```html
          <ul class="tour-stops">
            <li data-id="Imjingak & Jembatan Kebebasan (Freedom Bridge)" data-en="Imjingak & Freedom Bridge" data-th="อิมจินกักและสะพานแห่งอิสรภาพ">Imjingak &amp; Jembatan Kebebasan (Freedom Bridge)</li>
            <li data-id="Tunnel ke-3 (Third Infiltration Tunnel)" data-en="3rd Infiltration Tunnel" data-th="อุโมงค์แทรกซึมที่ 3">Tunnel ke-3 (Third Infiltration Tunnel)</li>
            <li data-id="Dora Observatory (Lihat Korea Utara!)" data-en="Dora Observatory (See North Korea!)" data-th="หอสังเกตการณ์โดรา (มองเห็นเกาหลีเหนือ!)">Dora Observatory (Lihat Korea Utara!)</li>
            <li data-id="Catatan: JSA tidak termasuk (butuh izin & bus resmi terpisah)" data-en="Note: JSA not included (requires separate permit & official bus)" data-th="หมายเหตุ: ไม่รวม JSA (ต้องขออนุญาตและใช้รถบัสที่ได้รับอนุญาตแยกต่างหาก)">Catatan: JSA tidak termasuk (butuh izin &amp; bus resmi terpisah)</li>
          </ul>
```

- [ ] **Step 3: Verify with a text search**

Run: `grep -n "JSA" "F:\pakleecar\index.html"`
Expected: the only remaining match is the new "Catatan: JSA tidak termasuk..." note line (i.e. no line claims JSA is a visited stop).

- [ ] **Step 4: Commit**

```bash
cd F:/pakleecar
git add index.html
git commit -m "fix: remove JSA from DMZ tour card, replace with Imjingak"
```

---

### Task 2: Add "쉐어투어" navigation links

**Files:**
- Modify: `F:\pakleecar\index.html:365-371` (`.nav-links`)
- Modify: `F:\pakleecar\index.html:386-390` (`.mobile-menu`)

**Interfaces:**
- Consumes: none
- Produces: an anchor target `#shared-tours` that Task 3 must create

- [ ] **Step 1: Add the desktop nav link between "Harga" and "FAQ"**

old_string:
```html
    <a href="#pricing" data-id="Harga" data-en="Pricing" data-th="ราคา">Harga</a>
    <a href="#faq" data-id="FAQ" data-en="FAQ" data-th="คำถามที่พบบ่อย">FAQ</a>
```

new_string:
```html
    <a href="#pricing" data-id="Harga" data-en="Pricing" data-th="ราคา">Harga</a>
    <a href="#shared-tours" data-id="Share Tour" data-en="Shared Tour" data-th="ทัวร์ร่วมคัน">Share Tour</a>
    <a href="#faq" data-id="FAQ" data-en="FAQ" data-th="คำถามที่พบบ่อย">FAQ</a>
```

- [ ] **Step 2: Add the same link to the mobile menu, in the same position**

old_string:
```html
  <a href="#pricing" onclick="toggleMobile()" data-id="Harga" data-en="Pricing" data-th="ราคา">Harga</a>
  <a href="#faq" onclick="toggleMobile()" data-id="FAQ" data-en="FAQ" data-th="คำถามที่พบบ่อย">FAQ</a>
```

new_string:
```html
  <a href="#pricing" onclick="toggleMobile()" data-id="Harga" data-en="Pricing" data-th="ราคา">Harga</a>
  <a href="#shared-tours" onclick="toggleMobile()" data-id="Share Tour" data-en="Shared Tour" data-th="ทัวร์ร่วมคัน">Share Tour</a>
  <a href="#faq" onclick="toggleMobile()" data-id="FAQ" data-en="FAQ" data-th="คำถามที่พบบ่อย">FAQ</a>
```

- [ ] **Step 3: Verify both links exist**

Run: `grep -n "shared-tours" "F:\pakleecar\index.html"`
Expected: 2 matches (desktop + mobile `<a href="#shared-tours">`) at this point — the section target itself doesn't exist yet, that's Task 3.

- [ ] **Step 4: Commit**

```bash
cd F:/pakleecar
git add index.html
git commit -m "feat: add Share Tour nav link (desktop + mobile)"
```

---

### Task 3: Add Shared Tour CSS (price-tier table inside a tour-card)

**Files:**
- Modify: `F:\pakleecar\index.html:247-260` (append after the existing `/* ── PRICING ── */` block, before `/* ── CANCELLATION ── */`)

**Interfaces:**
- Consumes: existing `--navy`, `--orange`, `--gray`, `--radius-sm`, `--shadow` CSS variables
- Produces: `.shared-tour-note` and `.shared-price-table` classes that Task 4 uses

- [ ] **Step 1: Insert new CSS rules right after the existing `.price-note` rule (line 260) and before the `/* ── CANCELLATION ── */` comment**

old_string:
```css
.price-note{margin-top:1.25rem;font-size:.85rem;color:var(--gray);background:var(--white);padding:1rem 1.25rem;border-radius:var(--radius-sm);border-left:4px solid var(--green)}

/* ── CANCELLATION ── */
```

new_string:
```css
.price-note{margin-top:1.25rem;font-size:.85rem;color:var(--gray);background:var(--white);padding:1rem 1.25rem;border-radius:var(--radius-sm);border-left:4px solid var(--green)}

/* ── SHARED TOUR ── */
.shared-tour-note{margin-bottom:2rem;background:var(--white);border-left:4px solid var(--orange);padding:1rem 1.25rem;border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:.88rem;color:var(--text)}
.shared-tour-note strong{color:var(--orange)}
.shared-tour-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.shared-price-table{width:100%;border-collapse:collapse;margin-top:1rem;font-size:.82rem}
.shared-price-table th{background:var(--gray-light);color:var(--navy);padding:.5rem .6rem;text-align:center;font-family:'Poppins',sans-serif;font-weight:600}
.shared-price-table td{padding:.5rem .6rem;text-align:center;border-top:1px solid #F3F4F6}
.shared-price-table .amount{font-family:'Poppins',sans-serif;font-weight:800;color:var(--orange)}
.shared-min-note{font-size:.72rem;color:var(--gray);margin-top:.5rem;font-style:italic}

/* ── CANCELLATION ── */
```

- [ ] **Step 2: Verify the CSS was inserted correctly**

Run: `grep -n "shared-price-table" "F:\pakleecar\index.html"`
Expected: 5 matches (the class definitions), all inside `<style>`.

- [ ] **Step 3: Commit**

```bash
cd F:/pakleecar
git add index.html
git commit -m "feat: add CSS for shared-tour price tables"
```

---

### Task 4: Add the Shared Tour section (3 route cards)

**Files:**
- Modify: `F:\pakleecar\index.html` — insert new `<section>` between the closing `</section>` of `<!-- PRICING -->` (line 653) and the opening `<!-- AIRPORT -->` comment (line 655)

**Interfaces:**
- Consumes: `.tour-card`, `.tour-header`, `.tour-badges`, `.badge-custom`, `.tour-body`, `.tour-stops`, `.shared-price-table`, `.shared-tour-note`, `.shared-min-note` (from Task 3), `discussTour()` JS function (already defined at the bottom of the file)
- Produces: `#shared-tours` anchor (target for Task 2's nav links), `#shared-calendar-seoul` / `#shared-calendar-nami` / `#shared-calendar-dmz` empty placeholder divs (consumed by the booking-availability-system plan)

- [ ] **Step 1: Insert the new section**

old_string:
```html
  </div>
</section>

<!-- AIRPORT -->
```

new_string:
```html
  </div>
</section>

<!-- SHARED TOUR -->
<section class="section" id="shared-tours">
  <div class="container">
    <div class="section-label reveal" data-id="Share Tour — Hemat Bareng!" data-en="Shared Tour — Save Together!" data-th="ทัวร์ร่วมคัน — ประหยัดไปด้วยกัน!">Share Tour — Hemat Bareng!</div>
    <h2 class="section-title reveal" data-id="Gabung Rombongan, Harga Lebih Murah 🤝" data-en="Join a Group, Pay Less 🤝" data-th="ร่วมกรุ๊ป จ่ายน้อยลง 🤝">Gabung Rombongan, Harga Lebih Murah 🤝</h2>
    <p class="section-sub reveal" data-id="Biaya sewa mobil dibagi rata dengan tim lain di tanggal yang sama — makin banyak yang gabung, makin murah per tim! Minimal 4 orang untuk berangkat." data-en="Car rental cost is shared with other teams on the same date — the more teams join, the cheaper per team! Minimum 4 people to depart." data-th="ค่าเช่ารถแบ่งกันกับทีมอื่นในวันเดียวกัน — ยิ่งมีคนร่วมมากยิ่งถูกลง! ต้องมีอย่างน้อย 4 คนจึงจะออกเดินทางได้">Biaya sewa mobil dibagi rata dengan tim lain di tanggal yang sama — makin banyak yang gabung, makin murah per tim! Minimal 4 orang untuk berangkat.</p>
    <div class="shared-tour-note reveal">
      <strong data-id="⚠️ Perlu diketahui:" data-en="⚠️ Please note:" data-th="⚠️ โปรดทราบ:">⚠️ Perlu diketahui:</strong>
      <span data-id=" Harga Share Tour ini HANYA untuk transportasi + supir (bensin, asuransi, tol termasuk). Tiket masuk tempat wisata TIDAK termasuk dan dibayar sendiri di lokasi — beda dengan tur berpemandu yang biasanya sudah termasuk tiket." data-en=" This Shared Tour price is for transport + driver ONLY (fuel, insurance, toll included). Attraction entrance tickets are NOT included and paid on-site — unlike guided tours which usually bundle tickets." data-th=" ราคาทัวร์ร่วมคันนี้รวมเฉพาะค่าเดินทาง + คนขับ (รวมน้ำมัน ประกัน ค่าทางด่วน) ไม่รวมค่าเข้าสถานที่ท่องเที่ยว ต้องจ่ายเองที่หน้างาน — ต่างจากทัวร์ไกด์นำเที่ยวที่มักรวมตั๋วเข้าชมไว้แล้ว"> Harga Share Tour ini HANYA untuk transportasi + supir (bensin, asuransi, tol termasuk). Tiket masuk tempat wisata TIDAK termasuk dan dibayar sendiri di lokasi — beda dengan tur berpemandu yang biasanya sudah termasuk tiket.</span>
    </div>
    <div class="shared-tour-grid">

      <!-- Shared: Seoul City -->
      <div class="tour-card reveal">
        <div class="tour-header classic">
          🏯
          <div class="tour-badges"><span class="badge-custom">🤝 Share Tour</span></div>
        </div>
        <div class="tour-body">
          <h3 data-id="Share Tour — Seoul Kota" data-en="Shared Tour — Seoul City" data-th="ทัวร์ร่วมคัน — ในเมืองโซล">Share Tour — Seoul Kota</h3>
          <ul class="tour-stops">
            <li data-id="Gwangjang Market (Pasar Street Food)" data-en="Gwangjang Market" data-th="ตลาดควางจัง">Gwangjang Market (Pasar Street Food)</li>
            <li data-id="Gyeongbokgung Palace" data-en="Gyeongbokgung Palace" data-th="พระราชวังเคียงบกกุง">Gyeongbokgung Palace</li>
            <li data-id="Bukchon Hanok Village" data-en="Bukchon Hanok Village" data-th="หมู่บ้านฮันอกบุกชอน">Bukchon Hanok Village</li>
            <li data-id="Myeongdong (Shopping)" data-en="Myeongdong (Shopping)" data-th="เมียงดง (ช้อปปิ้ง)">Myeongdong (Shopping)</li>
            <li data-id="N Seoul Tower (Namsan)" data-en="N Seoul Tower (Namsan)" data-th="หอคอย N Seoul Tower (นัมซาน)">N Seoul Tower (Namsan)</li>
          </ul>
          <table class="shared-price-table">
            <thead><tr>
              <th data-id="4 org" data-en="4 pax" data-th="4 คน">4 org</th>
              <th data-id="5 org" data-en="5 pax" data-th="5 คน">5 org</th>
              <th data-id="6-7 org" data-en="6-7 pax" data-th="6-7 คน">6-7 org</th>
            </tr></thead>
            <tbody><tr>
              <td class="amount">₩80,000</td>
              <td class="amount">₩70,000</td>
              <td class="amount">₩60,000</td>
            </tr></tbody>
          </table>
          <p class="shared-min-note" data-id="Harga per tim · 10 jam · min. 4 orang berangkat" data-en="Price per team · 10 hrs · min. 4 pax to depart" data-th="ราคาต่อทีม · 10 ชม. · ขั้นต่ำ 4 คนออกเดินทาง">Harga per tim · 10 jam · min. 4 orang berangkat</p>
          <div id="shared-calendar-seoul"></div>
          <div class="tour-footer">
            <div></div>
            <button class="btn-discuss" onclick="discussTour('Share Tour Seoul Kota')" data-id="Tanya Jadwal →" data-en="Ask Schedule →" data-th="สอบถามวันว่าง →">Tanya Jadwal →</button>
          </div>
        </div>
      </div>

      <!-- Shared: Nami Island -->
      <div class="tour-card reveal">
        <div class="tour-header nami">
          🍂
          <div class="tour-badges"><span class="badge-custom">🤝 Share Tour</span></div>
        </div>
        <div class="tour-body">
          <h3 data-id="Share Tour — Nami Island" data-en="Shared Tour — Nami Island" data-th="ทัวร์ร่วมคัน — เกาะนามิ">Share Tour — Nami Island</h3>
          <ul class="tour-stops">
            <li data-id="Nami Island (Pulau Nami)" data-en="Nami Island" data-th="เกาะนามิ">Nami Island (Pulau Nami)</li>
            <li data-id="Petite France" data-en="Petite France" data-th="เปอตีต์ ฟรองซ์">Petite France</li>
            <li data-id="Garden of Morning Calm" data-en="Garden of Morning Calm" data-th="สวนแห่งความสงบยามเช้า">Garden of Morning Calm</li>
            <li data-id="Alpaca World" data-en="Alpaca World" data-th="Alpaca World">Alpaca World</li>
          </ul>
          <table class="shared-price-table">
            <thead><tr>
              <th data-id="4 org" data-en="4 pax" data-th="4 คน">4 org</th>
              <th data-id="5 org" data-en="5 pax" data-th="5 คน">5 org</th>
              <th data-id="6-7 org" data-en="6-7 pax" data-th="6-7 คน">6-7 org</th>
            </tr></thead>
            <tbody><tr>
              <td class="amount">₩100,000</td>
              <td class="amount">₩90,000</td>
              <td class="amount">₩70,000</td>
            </tr></tbody>
          </table>
          <p class="shared-min-note" data-id="Harga per tim · 10 jam · min. 4 orang berangkat" data-en="Price per team · 10 hrs · min. 4 pax to depart" data-th="ราคาต่อทีม · 10 ชม. · ขั้นต่ำ 4 คนออกเดินทาง">Harga per tim · 10 jam · min. 4 orang berangkat</p>
          <div id="shared-calendar-nami"></div>
          <div class="tour-footer">
            <div></div>
            <button class="btn-discuss" onclick="discussTour('Share Tour Nami Island')" data-id="Tanya Jadwal →" data-en="Ask Schedule →" data-th="สอบถามวันว่าง →">Tanya Jadwal →</button>
          </div>
        </div>
      </div>

      <!-- Shared: DMZ -->
      <div class="tour-card reveal">
        <div class="tour-header dmz">
          🪖
          <div class="tour-badges"><span class="badge-custom">🤝 Share Tour</span></div>
        </div>
        <div class="tour-body">
          <h3 data-id="Share Tour — DMZ" data-en="Shared Tour — DMZ" data-th="ทัวร์ร่วมคัน — DMZ">Share Tour — DMZ</h3>
          <ul class="tour-stops">
            <li data-id="Imjingak & Jembatan Kebebasan" data-en="Imjingak & Freedom Bridge" data-th="อิมจินกักและสะพานแห่งอิสรภาพ">Imjingak &amp; Jembatan Kebebasan</li>
            <li data-id="Tunnel ke-3 (Third Infiltration Tunnel)" data-en="3rd Infiltration Tunnel" data-th="อุโมงค์แทรกซึมที่ 3">Tunnel ke-3 (Third Infiltration Tunnel)</li>
            <li data-id="Dora Observatory (Lihat Korea Utara!)" data-en="Dora Observatory (See North Korea!)" data-th="หอสังเกตการณ์โดรา (มองเห็นเกาหลีเหนือ!)">Dora Observatory (Lihat Korea Utara!)</li>
            <li data-id="Catatan: JSA tidak termasuk" data-en="Note: JSA not included" data-th="หมายเหตุ: ไม่รวม JSA">Catatan: JSA tidak termasuk</li>
          </ul>
          <table class="shared-price-table">
            <thead><tr>
              <th data-id="4 org" data-en="4 pax" data-th="4 คน">4 org</th>
              <th data-id="5 org" data-en="5 pax" data-th="5 คน">5 org</th>
              <th data-id="6-7 org" data-en="6-7 pax" data-th="6-7 คน">6-7 org</th>
            </tr></thead>
            <tbody><tr>
              <td class="amount">₩90,000</td>
              <td class="amount">₩80,000</td>
              <td class="amount">₩70,000</td>
            </tr></tbody>
          </table>
          <p class="shared-min-note" data-id="Harga per tim · 10 jam · min. 4 orang berangkat" data-en="Price per team · 10 hrs · min. 4 pax to depart" data-th="ราคาต่อทีม · 10 ชม. · ขั้นต่ำ 4 คนออกเดินทาง">Harga per tim · 10 jam · min. 4 orang berangkat</p>
          <div id="shared-calendar-dmz"></div>
          <div class="tour-footer">
            <div></div>
            <button class="btn-discuss" onclick="discussTour('Share Tour DMZ')" data-id="Tanya Jadwal →" data-en="Ask Schedule →" data-th="สอบถามวันว่าง →">Tanya Jadwal →</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- AIRPORT -->
```

- [ ] **Step 2: Verify the section and its 3 cards exist**

Run: `grep -n "id=\"shared-tours\"\|id=\"shared-calendar-seoul\"\|id=\"shared-calendar-nami\"\|id=\"shared-calendar-dmz\"" "F:\pakleecar\index.html"`
Expected: 4 matches, one for the section id and one for each of the three calendar placeholders.

- [ ] **Step 3: Open the file in a browser and manually verify**

Run: `start "F:\pakleecar\index.html"` (Windows) to open the file directly in the default browser.

Check:
- Clicking "Share Tour" in the nav scrolls to the new section, positioned between "Harga" (Pricing) and "Layanan Bandara" (Airport) — i.e. right after the private-tour pricing table, matching the "second most important product" placement.
- All 3 cards render with their stop lists and 3-column price tables ($80k/70k/60k for Seoul, $100k/90k/70k for Nami, $90k/80k/70k for DMZ).
- Switching language (ID/EN/TH buttons top-right) updates every string in the new section, including the price-table headers and the "⚠️ Perlu diketahui" note.
- Clicking "Tanya Jadwal →" on any card opens a WhatsApp link with the correct tour name pre-filled in the message.
- The existing "DMZ History Route" card further down (in `#tours`) no longer mentions JSA as a stop.

- [ ] **Step 4: Commit**

```bash
cd F:/pakleecar
git add index.html
git commit -m "feat: add Shared Tour section with 3 routes and price tables"
```

---

## Handoff note for the booking-availability-system plan

Each shared-tour card now has an empty `<div id="shared-calendar-seoul">` / `-nami` / `-dmz">` placeholder right below its price table and minimum-pax note. The booking-availability-system plan should render its per-route monthly calendar widget into these three divs (via JS, using `document.getElementById('shared-calendar-' + route)`), not create new anchor points.
