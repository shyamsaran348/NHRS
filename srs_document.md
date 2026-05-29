# Software Requirements Specification (SRS)

## National Highways Research Station (NHRS) Portal
### 🏛️ தேசிய நெடுஞ்சாலைகள் ஆராய்ச்சி நிலையம், சென்னை
**Highway Department, Government of Tamil Nadu & National Highways Authority of India (NHAI) Joint Portal**

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **National Highways Research Station (NHRS) Portal**. It outlines the functional, non-functional, and interface requirements for the system, which serves as a secure, audited, and Guidelines for Indian Government Websites (GIGW) compliant data store for highway tender records, administrative sanctions, and department hierarchies.

### 1.2 Scope
The NHRS Portal is a three-tier web application designed to replace paper-based and siloed administrative tracking of highway research, tenders, and sanction entries across the State of Tamil Nadu. The scope covers:
* **Engineering Personnel Registrations**: Administrative review and approval queue managed centrally.
* **Tender Work Submission**: Dynamic capture of the **21 core engineering columns** under strict circular boundaries.
* **Role-Based Access Control (RBAC)**: Fine-grained data access limits isolating records by Division, Circle, and state-wide oversight.
* **Dynamic Auditing & Live Logs**: A tamper-evident ledger tracking secure operations.
* **GIGW Compliance**: Front-end controls for font size resizers, bicultural state branding, and interactive legal policies popups.
* **Automated Data Maintenance**: Dynamic calculations of active financial years and a database archiver script preserving a 3-year storage footprint.

### 1.3 Definitions, Acronyms, and Abbreviations
* **NHRS**: National Highways Research Station (Guindy, Chennai).
* **GIGW**: Guidelines for Indian Government Websites (Standard issued by the Ministry of Electronics and Information Technology, India).
* **a11y**: Accessibility (refers to standard assistive support for low-vision or differently-abled users).
* **DE**: Divisional Engineer (Standard administrative unit in charge of a Division).
* **DSE**: Superintendent Engineer (Standard administrative unit in charge of a Circle).
* **DCE**: Deputy Chief Engineer (Central HQ Super Administrator).
* **RBAC**: Role-Based Access Control.
* **JWT**: JSON Web Token.
* **ORM**: Object Relational Mapper (SQLAlchemy).
* **RDBMS**: Relational Database Management System (PostgreSQL).

### 1.4 Technologies Used
* **Frontend**: React (Vite), TailwindCSS, Lucide Icons, LocalStorage APIs.
* **Backend**: FastAPI (Python 3.10+), SQLAlchemy ORM, Uvicorn Server, Pandas, Openpyxl.
* **Database**: PostgreSQL (Neon Cloud / Local server), PG-Bouncer connection pool.
* **Containerization**: Docker, Nginx (static asset serving and API reverse proxy).

---

## 2. Overall Description

### 2.1 Product Perspective
The NHRS Portal acts as a centralized administrative Intranet. It connects separate physical division branches to the regional circle offices and Guindy Headquarters over standard HTTP/HTTPS channels.

```text
  [ React Frontend (Vite) ] <--- HTTP/HTTPS ---> [ FastAPI Backend Gateway ]
                                                          |
                                                    SQLAlchemy ORM
                                                          v
                                              [ Cloud PostgreSQL (Neon) ]
```

### 2.2 Product Functions
The portal performs the following high-level operations:
1. **Secure Onboarding**: Engineers register publicly by designating their Circle and Division. Accounts remain disabled (`is_active = False`) until the DCE Super Admin reviews and approves them.
2. **Auto-Supervisor Mapping**: When a DE registers, the system automatically assigns them to their Circle's DSE manager in the database.
3. **Tender Record Entry**: Divisional Engineers submit rich project tender entries (sanction values, bid dates, and execution milestones) for their specific division.
4. **Circle Reviews**: Superintendent Engineers review and approve or reject submissions from their circle's DEs.
5. **Global Monitoring & Excel Export**: The DCE monitors all approved entries globally, filters records dynamically, reviews live audit logs, and exports formatted Excel reports.
6. **Database Size Pruning**: System administrators can run a background Python script to archive tenders older than 3 years into Excel files and delete them from the live database.

### 2.3 User Classes and Characteristics
* **Divisional Engineer (DE)**: Moderate computer skills. Submits data, checks own submissions, and modifies PENDING entries. Represents a single Division branch.
* **Superintendent Engineer (DSE)**: High operational oversight. Configures circle teams, reviews pending entries, and verifies active DE lists. Represents a single Circle branch.
* **Deputy Chief Engineer (DCE - Super Admin)**: Advanced administration. Oversees all state data, reviews audit trails, manages user credentials requests, and pulls analytical reports.

### 2.4 Design and Implementation Constraints
* **GIGW Accessibility Compliance**: Sizing controls must adjust all typography sizes proportionally and store configurations persistently in browser memory.
* **Data Isolation Boundaries**: Engineers must never view, edit, or search data outside their authorized designation boundaries (DE = Division, DSE = Circle).
* **Database Storage Limit**: The database size must remain beneath the 500 MB free-tier cloud limits by using structured archiving techniques.

---

## 3. External Interface Requirements

### 3.1 User Interfaces
* **Login & Registration Portal**: Centered GIGW-branded cards featuring Tamil Nadu crest, accessibility text resizing resizers (`A-`, `A`, `A+`), and bilingual navigation headers.
* **Accessibility Sizing Bar**: Fixed top-bar adjusting root HTML `font-size` dynamically based on local browser presets.
* **Interactive Legal Modals**:backdrop-blurred overlay dialog dialogs serving GIGW Privacy, Copyright, Hyperlinking, and Terms and Conditions pages.
* **21-Column Project Entry Form**: High-contrast, well-padded input layout organized into four thematic columns: General Project, Sanctions, Tender Details, and Milestones.

### 3.2 Software Interfaces
* **FastAPI to DB**: Connects via SQLAlchemy Engine using `postgresql+psycopg2://` drivers.
* **Frontend to Backend**: Communicates via standard JSON payload HTTP request-responses routed through a Vite config reverse proxy server.

### 3.3 Communications Interfaces
* **HTTPS**: Encrypted SSL transit for all communication in production.
* **JWT Token**: Transmitted in the HTTP headers under `Authorization: Bearer <TOKEN>` for all session authentications.

---

## 4. System Features (Functional Requirements)

### 4.1 Feature 1: User Onboarding and Credentials Approval Pipeline
* **Description**: Public signups are created as inactive. The DCE must manually approve them inside the admin dashboard.
* **Stimulus/Response Sequence**:
  * *DE/DSE signs up* $\rightarrow$ Account is created with `is_active = False` $\rightarrow$ DB records the request.
  * *Inactive user attempts login* $\rightarrow$ System blocks login and displays the custom pending warning notice.
  * *DCE logs in* $\rightarrow$ Pending registrations show a count badge $\rightarrow$ DCE clicks **Approve** $\rightarrow$ User's state switches to `is_active = True` and writes standard system logs.
  * *Approved user attempts login* $\rightarrow$ Auth succeeds and a secure JWT token is generated.

### 4.2 Feature 2: Role-Based Project Tenders Form Tracking
* **Description**: Divisional Engineers submit tender details that undergo structural RBAC filters.
* **Functional Requirements**:
  * Data entered by a DE must be validated locally (mandatory fields, numerical sanctions values).
  * A DE can only view project entries created within their own division.
  * Other DEs in the same Circle are forbidden from reading or accessing these entries (returns `403 Forbidden`).

### 3.3 Feature 3: Circle Review & Team Configuration Dashboard
* **Description**: DSEs manage their active circle team members and approve or reject submissions.
* **Functional Requirements**:
  * The DSE dashboard fetches entries dynamically using `/api/entries?circle_id=X`.
  * **Approve Action**: Sets status to `APPROVED`.
  * **Reject Action**: Sets status to `REJECTED` and requires writing an official rejection reason.
  * **Team List**: Shows all active DEs in their circle. If a new DSE registers, the database scans for existing unassigned DEs in the same circle and auto-links them to this manager.

### 4.4 Feature 4: Master Oversight, Excel Exporter, and Live Audit Logs
* **Description**: The DCE has central oversight of approved entries state-wide.
* **Functional Requirements**:
  * The Master Console provides real-time filters (Scheme Code, Financial Year, Progress Stage, Circle, and Division).
  * **Export Action**: Calls `/api/reports/export` returning a formatted Excel document (`.xlsx`) generated via Pandas.
  * **Audit Trail**: Shows a read-only list of all security-sensitive operations.

### 4.5 Feature 5: Rolling Financial Year Automation
* **Description**: The financial year list is generated dynamically to avoid manual database changes.
* **Functional Requirements**:
  * Based on the system calendar date, it finds the active financial year (April 1st to March 31st).
  * Automatically populates form selects with 2 past years, the active year, and 5 future years (e.g., in `2026-27` it shows up to `2031-32`).

### 4.6 Feature 6: Database Storage Archiver
* **Description**: Automates historical data archiving to keep the database size beneath 500 MB.
* **Functional Requirements**:
  * Running `python3 archive_old_data.py` calculates the active 3-year retention window.
  * Tenders older than 3 years are written into a formatted Excel file saved to `backend/archives/`.
  * Pruned entries are permanently removed from the live database, and a `DATABASE_ARCHIVE` audit log is recorded.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
* **Response Time**: All standard database API endpoints must execute and return JSON payloads in less than **100 milliseconds** under a concurrent load of 100 users.
* **High-Speed Lookups**: Important lookup columns (Email, Circle Name, Entry Status, Creator ID) must use B-Tree indexes, guaranteeing $O(\log N)$ fast database search.

### 5.2 Safety and Security Requirements
* **Data Isolation**: Database queries must use strict joins on user credentials parameters (`User.circle_id` / `User.division_id`), ensuring data leakage between circle boundaries is impossible.
* **Soft Deletions**: User rejections or project deletions must use soft-delete flags (`is_deleted = True`) to prevent accidental permanent data loss.
* **Bcrypt Password Hashing**: Passwords must never be stored in plain text. They must undergo secure salting and hashing inside [auth.py](file:///Users/shyam/Desktop/Govt%20Project/backend/auth.py#L33) using bcrypt.

### 5.3 Usability and GIGW Standards
* **Typography Scaling**: Resizing controls must adjust the base root text dynamically, preserving clear readability for low-vision engineers.
* **Color Contrast**: Web elements must maintain high contrast ratios (minimum 4.5:1) for optimal readability.

---

## 6. Entity-Relationship (ER) Schema & Database Tables

The database schema consists of 5 highly structured PostgreSQL tables:

```text
 circles (1) <---------- (N) divisions (1) <---------- (N) project_entries
    |                             |                               |
    | (1)                         | (1)                           | (1)
    v                             v                               v
 users (1) <------------------------------------------------- (N) project_entries
    | (1)
    v
 audit_logs (N)
```

### Table Definitions

#### 6.1 `circles`
* `id` (Integer): Primary Key (Auto-Increment)
* `name` (String(100)): Unique, Non-Nullable, **Indexed**
* `created_at` (DateTime)

#### 6.2 `divisions`
* `id` (Integer): Primary Key (Auto-Increment)
* `name` (String(100)): Non-Nullable, **Indexed**
* `circle_id` (Integer): Foreign Key $\rightarrow$ `circles.id` (On Delete: Cascade), Non-Nullable
* `created_at` (DateTime)

#### 6.3 `users`
* `id` (Integer): Primary Key (Auto-Increment)
* `name` (String(100)): Non-Nullable (User's full name & initial)
* `email` (String(150)): Unique, Non-Nullable, **Indexed**
* `password_hash` (String(255)): Non-Nullable
* `role` (Enum): `DCE` (Super Admin), `DSE` (Circle Manager), `DE` (Divisional submitter)
* `circle_id` (Integer): Foreign Key $\rightarrow$ `circles.id` (On Delete: Set Null), Nullable
* `division_id` (Integer): Foreign Key $\rightarrow$ `divisions.id` (On Delete: Set Null), Nullable
* `assigned_dse_id` (Integer): Self-referencing Foreign Key $\rightarrow$ `users.id` (DE mapped to DSE)
* `is_active` (Boolean): Default `False` (Pending Super Admin approval)
* `is_deleted` (Boolean): Default `False`
* `created_at` (DateTime), `updated_at` (DateTime)

#### 6.4 `project_entries`
* `id` (Integer): Primary Key (Auto-Increment)
* `created_by_id` (Integer): Foreign Key $\rightarrow$ `users.id` (Creator, **Indexed**)
* `circle_id` (Integer): Foreign Key $\rightarrow$ `circles.id` (**Indexed**)
* `division_id` (Integer): Foreign Key $\rightarrow$ `divisions.id` (**Indexed**)
* `scheme` (String(100)): Scheme name (e.g. CRIDP, **Indexed**)
* `year` (String(20)): Financial year (e.g. 2025-26, **Indexed**)
* `name_of_work` (Text): Detailed name of highway construction
* `admin_sanction_value` (Float): Administrative Sanction Value (in Lakhs)
* `tech_sanction_value` (Float): Technical Sanction Value (in Lakhs)
* `contract_value` (Float): Contract acceptance value (in Lakhs)
* `present_stage` (Text): Progress stage (Surveying, Completed, etc., **Indexed**)
* `status` (String(50)): `"PENDING"`, `"APPROVED"`, `"REJECTED"` (**Indexed**)
* `rejection_reason` (Text): Nullable
* `is_deleted` (Boolean), `submitted_at` (DateTime), `reviewed_at` (DateTime)

#### 6.5 `audit_logs`
* `id` (Integer): Primary Key (Auto-Increment)
* `user_id` (Integer): Foreign Key $\rightarrow$ `users.id` (**Indexed**)
* `action` (String(100)): Action types (`LOGIN`, `REGISTER`, `APPROVE_USER`, etc.)
* `details` (Text): Description of changes
* `timestamp` (DateTime)
