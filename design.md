# Frontend Re-Design & UI Hardening Specification (Prompt for Stitch)

This document serves as the absolute, complete functional and design specification for refactoring and re-architecting the **National Highways Research Station (NHRS) Portal** frontend. 

The objective is to replace the existing "vibecoded" dark-mode glassmorphic interface with a **high-end, clean, corporate, light-mode enterprise dashboard** suited for a state/national government engineering department.

---

## 🏛️ Part 1: Visual Design System & Aesthetics (Corporate Light Mode)

The interface must look clean, authoritative, trustworthy, and highly structured, drawing inspiration from modern enterprise software and national administrative portals.

### 1. Harmonious Color Palette (Light, Enterprise High-Contrast)
* **Primary (Base Navy)**: `#0B2545` (Deep, authoritative navy blue used for primary navigation, main headings, and branding elements).
* **Secondary (Active Slate)**: `#134074` (Muted blue-grey for secondary headers, selected states, and interactive tabs).
* **Accents (Government Gold/Teal)**: 
  * Accent Blue: `#1F7A8C` (For primary action buttons, tooltips, and focus rings).
  * Success Emerald: `#2EC4B6` (Muted, high-contrast teal-green for `APPROVED` states).
  * Warning Amber: `#F39C12` (For `PENDING` states).
  * Destructive Crimson: `#E74C3C` (For `REJECTED` states, error alerts, and deletion indicators).
* **Background System**:
  * Root Page Canvas: `#F4F6F9` (Muted light grey-blue canvas that reduces eye strain).
  * Card & Sidebar Backgrounds: `#FFFFFF` (Pure white for raised cards, dashboards, and input groups).
  * Inset Groups: `#F8FAFC` (Cool white-grey for tabular striping, inside containers, and disabled fields).
* **Border System**: `#E2E8F0` / `#CBD5E1` (Thin, clean borders instead of glowing shadows to separate information modules).

### 2. Premium Typography
* **Font Family**: Google Fonts **Inter** or **Outfit** (Sans-serif, clean, balanced tracking, high legibility for alphanumeric grid tables and heavy government forms).
* **Scale & Weight**:
  * Page Titles: `24px` | Semi-Bold (`600`) or Bold (`700`) in primary Navy.
  * Card/Tab Headers: `14px` or `16px` | Semi-Bold (`600`) in primary Navy, uppercase with light letter-spacing where appropriate.
  * Body Text: `13px` or `14px` | Regular (`400`) or Medium (`500`) in `#334155` (Slate-700) for comfortable reading.
  * Subtext/Labels: `11px` | Semi-Bold (`600`) in `#64748B` (Slate-500) for all form inputs.

### 3. Layout, Shadows & Micro-Animations
* **Borders**: All cards, inputs, and tables must use explicit, thin borders (`border border-slate-200`) with modest border-radius (`rounded-xl` / `rounded-lg`, i.e., `8px` to `12px`).
* **Shadows**: Muted, subtle elevation shadows only (e.g., `shadow-sm` or `shadow-md` using a light grey shadow mapping, never dark neon glows).
* **Transitions**: Smooth, subtle micro-animations on interactive elements (`transition-all duration-200 ease-in-out` on hover, focus, and state changes).
* **Responsiveness**: Complete container-fluid fluid responsiveness across phone, tablet, and widescreen desktop devices.

---

## 📋 Part 2: Dynamic Features & Page Specifications

The system contains four core views: **Global Authentication & Header**, **Divisional Engineer (DE) Submissions View**, **Deputy Superintendent Engineer (DSE) Approvals View**, and **Deputy Chief Engineer (DCE) HQ Dashboard**. All features below must be implemented exactly as described.

### 1. Global Header, Footer, and Session Controller (`App.jsx`)
* **Branding Segment (Left)**: 
  * State Emblem or high-quality administrative icon (e.g., `Landmark` or custom emblem vector).
  * Primary title: "NHRS PORTAL" in bold Navy.
  * Secondary badge: "GOVERNMENT OF TAMIL NADU" in an elegant, small, white-on-navy badge.
  * Lower subtitle: "National Highways Research Station, Chennai".
* **User Information (Right)**:
  * Display current user's name (e.g., `Er. K. Ramesh`) and their full designation based on role (e.g., `Divisional Engineer`, `Superintendent Engineer`, `Deputy Chief Engineer`).
  * Green pulse dot signifying an active, encrypted JWT session.
  * A clear, professional, bordered **Logout** button (`Secure Logout`) with a subtle door/logout icon.
* **Global Authentication Context**:
  * Controls login state, checks `localStorage` for JWT tokens, and handles startup verification by hitting `/api/auth/me`.
  * Renders a highly professional, light-mode loading skeleton when checking active tokens.
  * Provides strict **Router Guards** protecting roles; if a user tries to alter elements, they are redirected back to their authorized panel.

### 2. Portal Access Login Page (`Login.jsx`)
* **Visuals**: Centered, modern card layout on a `#F4F6F9` background.
* **Credentials Panel**:
  * Input groups with explicit labels for Email Address and Security Password.
  * High-visibility blue focus rings when elements are active.
  * Form validation alerts displayed in clear, red-bordered callout boxes.
* **NHRS Quick-Access Profile Selector**:
  * Instead of simple links, present three beautifully aligned, light-grey corporate profile cards at the bottom.
  * Card 1: **Divisional Engineer (DE)** (Email: `de_ccr_1@nhrs.gov.in` | CCR 1 Division)
  * Card 2: **Superintendent Engineer (DSE)** (Email: `dse_chennai@nhrs.gov.in` | Chennai Circle)
  * Card 3: **Deputy Chief Engineer (DCE)** (Email: `dce@nhrs.gov.in` | Guindy HQ)
  * Clicking any card instantly prefills credentials and executes a secure JWT login, accelerating demo evaluation.

### 3. Divisional Engineer (DE) Dashboard (`DEDashboard.jsx`)
* **Header**: Welcome banner showing the engineer's name, assigned Circle, and Division (e.g., `Chennai Circle / CCR 1 Division`).
* **Feature A: Stepped Project Work Entry Form**:
  * Breaks down the exhaustive **21-column schema** into three highly organized wizard steps with a progress indicator bar.
  * **Step 1: Administrative Sanctions & Reference**:
    * Scheme Code (e.g., `CRIDP` or `NABARD`) - *Mandatory input*
    * Financial Year (e.g., `2025-26`, `2026-27`) - *Dropdown*
    * Name of the Work (full descriptive engineering title) - *Textarea*
    * Administrative Sanction Details (G.O. Ms Reference) - *Input*
    * Administrative Sanction Value (in Lakhs) - *Numeric input*
    * Technical Sanction Reference (proc. details) - *Input*
    * Technical Sanction Value (in Lakhs) - *Numeric input*
  * **Step 2: Tender Milestones & Value**:
    * Tender Notice Number - *Input*
    * Tender Notice Date - *Date picker*
    * Bid Submission Date - *Date picker*
    * Bid Opening Date - *Date picker*
    * Contract Value (in Lakhs) - *Numeric input*
    * Tender Accepting Authority (e.g., `DE`, `SE`, `CE`, `COT`) - *Dropdown*
    * Tender Approved On Date - *Date picker*
  * **Step 3: Work Execution & Remarks**:
    * Work Order Issued On Date - *Date picker*
    * Agreement Executed On Date - *Date picker*
    * Present Stage of Work (e.g., `Surveying`, `Earthwork in progress`, `Sub-grade preparation`) - *Input*
    * Special Office Remarks / Field Notes - *Textarea*
  * **Actions**: "Next", "Back", and "Submit Record" buttons. Includes full loading indicators and database validation error handlers.

* **Feature B: Submissions Status Queue**:
  * Displays a beautifully structured data table of all submissions created by the DE.
  * Columns: ID, Division, Name of Work, Scheme & Year, Contract Value (with rupee symbol), Date Submitted, and **Status Badge**.
  * **Status Badge Colors**:
    * `PENDING`: Muted amber badge (`bg-amber-50 text-amber-700 border border-amber-200`).
    * `APPROVED`: Muted emerald badge (`bg-emerald-50 text-emerald-700 border border-emerald-200`).
    * `REJECTED`: Muted red badge (`bg-red-50 text-red-700 border border-red-200`).
  * **Rejection Details**: If a work status is `REJECTED`, display a red-bordered callout card directly beneath the row showcasing the correction comments left by the Superintendent Engineer.
  * **DE Action Controls**:
    * **Edit Button**: Allowed on `PENDING` and `REJECTED` entries. Opens the 3-step form with prefilled values. Editing a rejected entry and saving automatically resets its status to `PENDING` for DSE re-evaluation.
    * **Delete Button**: Soft-deletes `PENDING` or `REJECTED` drafts with a confirm modal (sends `DELETE` request, sets `is_deleted = True` behind transactional database protection).

### 4. Deputy Superintendent Engineer (DSE) Dashboard (`DSEDashboard.jsx`)
* **Header**: Welcome banner indicating the managed circle (e.g., `Chennai Circle Operations Cockpit`).
* **Modular Tab Controller**: Clean, bordered segment tabs for **Review Pipeline** and **Team Assignment**.
* **Feature A: Review & Approval Pipeline**:
  * Displays status filter buttons (`PENDING`, `APPROVED`, `REJECTED`) with current counts.
  * Renders a table of circle-level DE submissions.
  * Clicking "Review Record" opens a full-screen or modal **Tender Review Cockpit**.
  * **DSE Data Review & Correction Authority**:
    * The DSE must be able to review all 21 columns of data.
    * Rather than just viewing, all form fields are active and editable for the DSE. They can correct minor mistakes (e.g., typo in a sanction number or date) and click **"Save Draft Changes"** to commit edits back to the database prior to issuing a final verdict.
  * **Decision Control Suite (Footer)**:
    * **Approve Button**: Instantly elevates status to `APPROVED`, locking it from DE edits and releasing it to the central HQ master console.
    * **Reject & Return Button**: Opens a feedback textarea. The DSE enters correction guidelines, returning the record to the DE's dashboard with the status set to `REJECTED`.

* **Feature B: Team Assignment & Engineer Roster**:
  * A two-column interactive board:
  * **Left Column (Active Circle DEs)**:
    * Displays the engineers currently assigned to this DSE's circle team.
    * Renders their actual name (e.g., `Er. K. Ramesh`), email, and a division badge (e.g., `CCR 1 DE`).
    * Includes an elegant red "Release Engineer" button. Clicking this releases them back to the unassigned pool with an alert confirmation.
  * **Right Column (Search & Add Unassigned Engineers)**:
    * Displays the pool of active, unassigned Divisional Engineers inside the circle.
    * Includes a real-time **Search Box** ("Search DE by name, email, or division..."). Typing dynamically filters the list based on name, email, or division.
    * Includes an "Add DE" button that instantly assigns the engineer to the DSE's team.

### 5. Deputy Chief Engineer (DCE) HQ Dashboard (`DCEDashboard.jsx`)
* **HQ Overview Metrics Banner**:
  * Metric Card 1: **Centrally Approved Works** (total approved entries across all Tamil Nadu circles).
  * Metric Card 2: **Active Circle Domains** (shows the 10 circles under HQ oversight).
  * Tab navigation to switch between the **Master Console** and the **System Audit Logs**.
* **Feature A: Oversight Master Console & Filter Grid**:
  * **Filter Bar**: A 5-column light-mode input row:
    * **Circle Domain** (select dropdown of 10 circles).
    * **Division Domain** (select dropdown of divisions; dynamically populated only with the divisions of the selected Circle).
    * **Financial Year** (dropdown).
    * **Scheme Code** (text search input).
    * **Progress Stage** (text search input).
    * **Reset Filters** text link to instantly wipe all values.
  * **Excel Spreadsheet Exporter**:
    * A primary emerald button **"Export Approved Report"** (with spreadsheet icon).
    * Downloads a professionally formatted Excel spreadsheet of all filtered, approved entries instantly (processed via backend `BackgroundTasks`).
  * **Master Approved Works Table Grid**:
    * Columns: Expand control, Circle & Division, Name of Work (with text-truncate), Scheme & Financial Year, Administrative Sanction Value, Contract Value, Present Progress Stage.
    * **Expandable Work Drawers**:
      * Clicking any row smooth-expands a highly detailed, 3-column structured metadata panel.
      * Column 1: **Administrative Credentials** (G.O. Reference, Technical Sanction Reference, Technical Sanction Value).
      * Column 2: **Tender & Acceptance Details** (Notice No & Date, Accepting Authority, Approved On Date, Bid Submission & Opening Dates).
      * Column 3: **Work Order & Compliance Audit** (Work Order Issued Date, Agreement Executed Date, Field/Office Remarks, and a "Securely Approved" watermark).

* **Feature B: Live System Audit Trail Logs**:
  * A scrollable journal tracking all security-sensitive operations inside the NHRS portal.
  * Lists who performed what action, when, and from what authorization tier.
  * Action badges are color-coded:
    * Approvals and Team additions: Emerald.
    * Rejections and Team removals: Red.
    * Logins and updates: Slate.

---

## 🔌 Part 3: Backend API Integration Contracts

Stitch must ensure all state integrations bind perfectly to the following backend endpoint paths:

### 1. Security & Authentication
* **`POST /api/auth/login`**: Accepts `UserLogin` schema (`email`, `password`). Returns `UserToken` containing JWT `access_token`, `role`, `email`, and `name`.
* **`GET /api/auth/me`**: Fetches the authenticated user profile. Returns circle and division associations.

### 2. Team Management
* **`GET /api/users/unassigned`**: Fetches unassigned DEs belonging to the DSE's circle.
* **`GET /api/team`**: Fetches DEs in the logged-in DSE's team.
* **`POST /api/team`**: Adds a DE to the team (`de_id` parameter).
* **`DELETE /api/team/{de_id}`**: Removes a DE from the team.

### 3. Project Entries CRUD & Workflow
* **`POST /api/entries`**: Creates a new project entry under the DE's division. Sets status to `PENDING`.
* **`GET /api/entries`**: List project entries with dynamic query parameters (`scheme`, `year`, `circle_id`, `division_id`, `status_filter`, `stage`, `limit`, `offset`).
* **`GET /api/entries/{entry_id}`**: Fetches a single entry.
* **`PUT /api/entries/{entry_id}`**: Updates an entry (DE/DSE/DCE edit authority).
* **`PUT /api/entries/{entry_id}/review`**: Approves or Rejects an entry (`status` and `rejection_reason` parameters).
* **`DELETE /api/entries/{entry_id}`**: Soft-deletes a pending/rejected draft record.

### 4. Excel Exports & Logging
* **`GET /api/reports/export`**: Triggers background generation of the formatted Excel report.
* **`GET /api/audit-logs`**: Fetches audit trail logs (DCE only).
* **`GET /api/circles`**: Fetches all 10 circles (DCE/DSE).
* **`GET /api/divisions`**: Fetches divisions (with optional `circle_id` query parameter).
