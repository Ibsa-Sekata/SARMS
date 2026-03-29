# QUICK START GUIDE

## Step 1: Insert Data into MySQL

Open **MySQL Workbench** and run this file:
```
database/INSERT_ALL_DATA.sql
```

Or from command line:
```bash
mysql -u root -p school_system < database/INSERT_ALL_DATA.sql
```

## Step 2: Start Backend

```bash
cd backend
npm start
```

You should see:
```
🚀 SRMS Backend server running on port 5000
✅ Database connected successfully
```

## Step 3: Start Frontend

Open a NEW terminal:
```bash
cd frontend
npm run dev
```

You should see:
```
Local: http://localhost:5173/
```

## Step 4: Login

Open browser: http://localhost:5173/

### Login Credentials:

**Administrator:**
- Username: `admin`
- Password: `password123`

**Homeroom Teacher (Grade 9A):**
- Username: `sarah.johnson`
- Password: `password123`

**Subject Teacher (English):**
- Username: `david.miller`
- Password: `password123`

---

## All Available Logins:

| Username | Password | Role | Class/Department |
|----------|----------|------|------------------|
| admin | password123 | Administrator | Full Access |
| sarah.johnson | password123 | Homeroom Teacher | Grade 9A / Mathematics |
| michael.brown | password123 | Homeroom Teacher | Grade 9B / English |
| emily.davis | password123 | Homeroom Teacher | Grade 10A / Biology |
| robert.wilson | password123 | Homeroom Teacher | Grade 10B / Chemistry |
| lisa.anderson | password123 | Homeroom Teacher | Grade 11A / Physics |
| jennifer.lee | password123 | Homeroom Teacher | Grade 11B / Mathematics |
| david.miller | password123 | Subject Teacher | English |
| maria.garcia | password123 | Subject Teacher | Biology |

---

## Troubleshooting:

### Backend won't start?
1. Make sure MySQL is running
2. Check database name is `school_system`
3. Run: `node backend/test-db.js` to test connection

### Login says "server error"?
1. Check backend is running on port 5000
2. Check backend terminal for errors
3. Make sure you ran the INSERT_ALL_DATA.sql file

### No data showing?
1. Run the INSERT_ALL_DATA.sql file in MySQL Workbench
2. Restart backend: `npm start`

---

## What Each Role Can Do:

### Admin:
- Manage all teachers
- Manage all students
- Manage all classes
- View all reports

### Homeroom Teacher:
- Manage students in their class
- View all marks for their class
- Generate student roster
- Print reports

### Subject Teacher:
- Enter marks for their subject
- View students in assigned classes
- Update marks before submission

---

## Testing the Roster:

1. Login as: `sarah.johnson` / `password123`
2. Click "Generate Roster"
3. Select Class: Grade 9A
4. You should see 4 students with marks, totals, averages, ranks, and pass/fail status

---

## Need Help?

Check the backend terminal for error messages!
