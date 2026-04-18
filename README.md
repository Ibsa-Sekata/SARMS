# SARMS — Student Academic Record Management System

<div align="center">

![SARMS Banner](https://img.shields.io/badge/SARMS-Student%20Record%20Management-2563eb?style=for-the-badge&logo=graduation-cap&logoColor=white)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A full-stack web application for managing student academic records — marks entry, homeroom approval, class rosters, teacher assignments, and school administration.

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Project Structure](#project-structure) · [API Reference](#api-reference) · [Screenshots](#screenshots)

</div>

---

## Features

### For Teachers
- **Mark Entry** — Enter and save student marks per subject and class
- **Submit to Homeroom** — Forward marks to the homeroom teacher for review
- **Student Directory** — Browse students in assigned classes
- **Class Picker** — Switch between multiple class/subject assignments from the sidebar

### For Homeroom Teachers
- **Approve Marks** — Review subject-level completion and approve all marks in one action
- **Student Roster** — Generate ranked student rosters with totals, averages, and pass/fail status
- **Export & Print** — Download roster as a styled HTML file or send to printer

### For Administrators
- **Department & Subject Management** — Create departments with linked subjects
- **Teacher Management** — Create teacher accounts with login credentials
- **Student Enrollment** — Enrol students into classes, search and export CSV
- **Class Management** — Create grade/section combinations, assign homeroom and subject teachers
- **Academic Settings** — Set the active academic year and semester system-wide

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 6 |
| Styling | Plain CSS with CSS custom properties (design tokens) |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Backend | Node.js, Express 4 |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Validation | express-validator |
| Database | MySQL 8 (mysql2 driver) |
| Dev Tools | Nodemon, ESLint |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** 8.0 or higher
- **npm** v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/your-username/sarms.git
cd sarms
```

### 2. Set up the database

Open MySQL and run the schema:

```bash
mysql -u root -p < database/schema.sql
```

Optionally run views and stored procedures:

```bash
mysql -u root -p school_system < database/views_and_procedures.sql
```

### 3. Configure the backend

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=school_system

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

### 4. Install backend dependencies and start

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### 5. Configure the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Install frontend dependencies and start

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
sarms/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool
│   ├── controllers/              # Route handler logic
│   │   ├── authController.js
│   │   ├── markController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── classController.js
│   │   ├── departmentController.js
│   │   ├── reportController.js
│   │   ├── settingsController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   └── errorMiddleware.js
│   ├── models/                   # Database query functions
│   ├── routes/                   # Express route definitions
│   ├── services/                 # Business logic layer
│   ├── utils/
│   │   └── initDatabase.js       # Auto-migration on startup
│   ├── app.js                    # Express app setup
│   └── server.js                 # Entry point
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── AppShell.jsx      # Sidebar + topbar layout
│       │   └── admin/
│       │       └── AdminPageLayout.jsx
│       ├── contexts/
│       │   ├── AuthContext.jsx   # Auth state & JWT storage
│       │   └── TeacherClassContext.jsx
│       ├── services/
│       │   └── api.js            # Axios instance with interceptors
│       ├── views/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── MarkEntry.jsx
│       │   ├── HomeroomApproval.jsx
│       │   ├── StudentRoster.jsx
│       │   ├── StudentManagement.jsx
│       │   └── Admin/
│       │       ├── ManageTeachers.jsx
│       │       ├── ManageStudents.jsx
│       │       ├── ManageClasses.jsx
│       │       ├── ManageDepartments.jsx
│       │       └── AcademicSettings.jsx
│       ├── App.jsx               # Router & protected routes
│       ├── App.css               # All component styles
│       └── index.css             # Design tokens & global reset
│
└── database/
    ├── schema.sql                # Full database schema
    └── views_and_procedures.sql  # DB views & stored procedures
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Login (admin or teacher) |
| `GET` | `/auth/me` | Get current user |

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/students` | List all students (supports `?q=search`) |
| `POST` | `/students` | Create student |
| `PUT` | `/students/:id` | Update student |
| `DELETE` | `/students/:id` | Delete student |
| `GET` | `/students/class/:classId` | Students in a class |

### Marks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/marks` | Get marks (filter by class, subject, year, semester) |
| `POST` | `/marks/batch` | Save multiple marks at once |
| `POST` | `/marks/submit-to-homeroom` | Submit marks for homeroom review |
| `GET` | `/marks/homeroom/submitted` | Get submitted marks (homeroom teacher) |
| `POST` | `/marks/homeroom/approve-all` | Approve all submitted marks |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/roster/:classId` | Generate student roster |
| `GET` | `/reports/roster/:classId/stored` | Load saved roster snapshot |

### Teachers, Classes, Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/teachers` | List / create teachers |
| `PUT/DELETE` | `/teachers/:id` | Update / delete teacher |
| `GET/POST` | `/classes` | List / create classes |
| `GET/POST` | `/departments` | List / create departments |
| `GET/POST` | `/teacher-assignments` | List / create assignments |
| `DELETE` | `/teacher-assignments/:id` | Remove assignment |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/settings/context` | Get active year & semester |
| `PUT` | `/settings/context` | Update active year & semester |
| `GET` | `/settings/years` | List all academic years |

---

## Database Schema

```
users ──────────── teachers ──── departments
                       │               │
                       │           subjects
                       │
              teacher_assignments
                  │        │
               classes   subjects
                  │
              students
                  │
               marks ──── semesters
                  │
            academic_years

system_settings  (current_year_id, current_semester_id)
```

Key design decisions:
- One mark record per `(student, subject, semester, year)` — unique constraint enforced at DB level
- Homeroom teacher is a flag on the `teachers` table linked to a class
- Roster snapshots are stored server-side after generation

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | — | MySQL password |
| `DB_NAME` | `school_system` | Database name |
| `JWT_SECRET` | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |

---

## Scripts

### Backend

```bash
npm run dev      # Start with nodemon (hot reload)
npm start        # Start in production
npm test         # Run tests
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Roles & Permissions

| Feature | Admin | Teacher | Homeroom Teacher |
|---------|:-----:|:-------:|:----------------:|
| Manage departments | ✅ | — | — |
| Manage teachers | ✅ | — | — |
| Manage students | ✅ | — | — |
| Manage classes | ✅ | — | — |
| Academic settings | ✅ | — | — |
| Enter marks | — | ✅ | ✅ |
| View students | ✅ | ✅ | ✅ |
| Approve marks | — | — | ✅ |
| Generate roster | — | — | ✅ |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
Built with ❤️ for schools that deserve better software.
</div>
