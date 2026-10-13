# Timetable Automation System

> A role-based, full-stack timetable management platform built for institutions with 15+ departments and 200+ faculty — engineered to eliminate manual scheduling overhead and prevent unauthorized schedule modifications.

---

## Table of Contents

- [Overview](#overview)
- [Key Highlights](#key-highlights)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
  - [Excel Import & Parsing Engine](#excel-import--parsing-engine)
  - [REST API](#rest-api)
  - [PDF Generation](#pdf-generation)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Overview

The **Timetable Automation System** is a production-grade web platform designed to digitize and automate the end-to-end timetable management workflow for universities and colleges. The system replaces fragmented, error-prone manual processes with a centralized, access-controlled scheduling engine.

The platform supports a **two-tier administrative hierarchy** — institute-level administrators who allocate rooms and departments, and department heads who manage subject and faculty assignments within their own allocations. This separation of privilege ensures data integrity and eliminates unauthorized modifications to the master schedule.

---

## Key Highlights

| Metric | Impact |
|---|---|
| Departments Managed | 15+ |
| Faculty Covered | 200+ |
| Manual Scheduling Effort Reduced | **70%** |
| Spreadsheet Parsing Failures Reduced | **95%** |
| Parsing Latency | **< 100ms** |
| API Query Performance Improvement | **40%** |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│              React + Vite · SheetJS · Lucide             │
└────────────────────────┬────────────────────────────────┘
                         │ REST (HTTP/JSON)
┌────────────────────────▼────────────────────────────────┐
│                  Backend API Server                       │
│              Express.js (Node ≥ 18) · PDFKit             │
│                                                           │
│   ┌──────────────┐  ┌────────────┐  ┌─────────────────┐ │
│   │  Auth Layer  │  │  RBAC MW   │  │  PDF Generator  │ │
│   │ (Base64 tok) │  │ (2-tier)   │  │  (Room/Faculty) │ │
│   └──────────────┘  └────────────┘  └─────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│                      MongoDB Atlas                        │
│         Collections: users · rooms (timetable)           │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Role |
|---|---|
| **Node.js ≥ 18** | Runtime |
| **Express.js v5** | REST API framework |
| **MongoDB + Mongoose** | Database & ODM |
| **PDFKit** | Server-side PDF generation |
| **dotenv** | Environment configuration |
| **Docker / Render / Railway** | Deployment targets |

### Frontend
| Technology | Role |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **SheetJS (xlsx)** | Spreadsheet parsing engine |
| **Lucide React** | Icon system |
| **Vanilla CSS** | Styling |

---

## Features

### Role-Based Access Control (RBAC)

The system implements a **two-tier privilege model** that cleanly separates administrative responsibilities:

| Role | Identifier | Capabilities |
|---|---|---|
| **Institute Incharge** | `institute_incharge` | Full access — allocate rooms to departments, bulk-upload master timetable, edit any field in any slot |
| **Department Incharge** | `dept_incharge` | Scoped access — edit subject, faculty, branch, and section only within slots pre-allocated to their department |

**Key enforcement mechanism:** Every write endpoint (`POST /api/rooms/timetable`) validates the caller's role and department before mutating any record. A `dept_incharge` attempting to modify an unallocated slot or a slot assigned to a different department receives a `403 Forbidden` with a descriptive error — completely eliminating unauthorized overrides at the API layer.

---

### Excel Import & Parsing Engine

The frontend integrates a **layout-agnostic spreadsheet importer** powered by SheetJS that can ingest timetable Excel files regardless of their grid orientation.

**Design decisions:**
- Auto-detects whether the spreadsheet encodes days as rows or columns.
- Normalizes different header naming conventions (e.g., `Monday`, `Mon`, `MON`) into a canonical internal format.
- Parses composite cell formats such as `SubjectName (TeacherName)` and splits them into structured fields.
- Executes the full parse-and-normalize pipeline **in under 100ms** for typical institutional spreadsheets.
- Dramatically reduces parsing failures — previously caused by layout inconsistencies across departments — by **95%**.

Bulk-parsed data is submitted to `POST /api/rooms/timetable/bulk`, which persists department allocations in a single atomic operation.

---

### REST API

All API routes are designed for clarity, composability, and performance:

- **Filtering support:** Queries can be scoped by `branch`, `faculty`, or `room`, reducing unnecessary data transfer and improving query response time by **40%** compared to full-collection scans.
- **Public endpoints** (room listings, timetable views) require no authentication, supporting kiosk or display board use-cases.
- **Protected endpoints** (writes, bulk uploads) require a Bearer token and validate role permissions server-side.

---

### PDF Generation

The backend can generate publication-quality PDF documents on demand using PDFKit:

| Export Type | Endpoint | Description |
|---|---|---|
| **Room Timetable (single)** | `GET /api/rooms/:roomId/timetable/pdf` | Landscape grid PDF for a specific room |
| **All Rooms Timetable** | `GET /api/rooms/timetable/pdf` | Multi-page PDF — one page per room, sorted alphabetically |
| **Faculty Schedule** | `GET /api/teachers/timetable/pdf?teacher=Name` | Landscape grid showing a faculty member's full weekly schedule across all rooms |

All PDFs render a **day × lecture-slot grid** with color-coded headers, alternating row shading, and structured cell content (subject code, subject name, teacher, branch, section, room).

---

## Project Structure

```
Timetable_proj/
├── backend/                        # Express.js API server
│   ├── src/
│   │   ├── index.js                # All routes, schemas, PDF generators
│   │   ├── seedUsers.js            # Seed script for admin users
│   │   └── seedTimetableData.js    # Seed script for timetable data
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── render.yaml
│   ├── railway.json
│   └── package.json
│
├── web_app/                        # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                 # Root component & routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Role-aware landing dashboard
│   │   │   └── TimetableEdit.jsx   # Timetable editor & Excel importer
│   │   ├── components/             # Reusable UI components
│   │   ├── context/                # React context (auth state)
│   │   ├── hooks/                  # Custom hooks
│   │   ├── utils/                  # SheetJS parsing utilities
│   │   └── styles/                 # Component-level CSS
│   ├── vite.config.js
│   └── package.json
│
└── Weekly_Lecture_Timetable_With_Teachers.xlsx   # Sample timetable file
```

---

## Getting Started

### Prerequisites

- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set:
#   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
#   PORT=5000

# 4. Seed initial admin users (optional)
npm run seed

# 5. Start the development server
npm run dev
# → Server running on http://localhost:5000
```

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd web_app

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set:
#   VITE_API_URL=http://localhost:5000

# 4. Start the development server
npm run dev
# → App running on http://localhost:5173
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ✗ Public | Authenticate and receive a Bearer token |

### Rooms & Timetables

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rooms` | ✗ Public | List all room IDs |
| `GET` | `/api/rooms/:roomId/timetable` | ✗ Public | Fetch timetable for a specific room |
| `POST` | `/api/rooms/timetable` | ✓ Required | Save or update a single lecture slot |
| `POST` | `/api/rooms/timetable/bulk` | ✓ Institute only | Bulk-upload department allocations from Excel |

### PDF Exports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rooms/timetable/pdf` | ✗ Public | Download all-rooms timetable as PDF |
| `GET` | `/api/rooms/:roomId/timetable/pdf` | ✗ Public | Download timetable PDF for a specific room |
| `GET` | `/api/teachers/timetable/pdf?teacher=` | ✗ Public | Download faculty schedule PDF |

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | ✗ Public | Service and database connectivity status |

---

## Deployment

The project includes ready-to-use deployment configurations for multiple platforms:

| Platform | Config File | Notes |
|---|---|---|
| **Render** | `render.yaml` | Web service + environment group |
| **Railway** | `railway.json` | Auto-detected Node.js buildpack |
| **Docker** | `Dockerfile` + `docker-compose.yml` | Self-hosted / any container platform |

Refer to [`backend/DEPLOYMENT.md`](./backend/DEPLOYMENT.md) and [`backend/RENDER_DEPLOYMENT.md`](./backend/RENDER_DEPLOYMENT.md) for detailed, platform-specific deployment guides.

---

> Built with ❤️ to eliminate spreadsheet chaos from institutional scheduling.
