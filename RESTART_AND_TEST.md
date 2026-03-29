# 🚀 Restart and Test Guide

## Critical Fixes Applied

I've fixed both the teacher creation and student creation errors. Here's what was wrong and what I fixed:

### 1. Teacher Creation Error ✅
**Problem**: Transaction commands not supported with prepared statements
**Solution**: Changed from `connection.execute()` to `connection.query()` for all transaction operations

### 2. Student Creation Error ✅
**Problem**: Gender field was sending 'Male'/'Female' instead of 'M'/'F'
**Solution**: Updated dropdown to send correct values ('M' or 'F')

---

## Step-by-Step Instructions

### Step 1: Verify Database Setup

Run this command to check your database:

```bash
cd backend
node verify-database.js
```

This will show you:
- ✅ All departments (should show 5: Mathematics, English, Biology, Chemistry, Physics)
- ✅ All users (should show admin and teachers)
- ✅ All classes, students, subjects, etc.

If you see warnings about missing data, run the SQL script:
```bash
# In MySQL Workbench or command line:
# Run: database/INSERT_ALL_DATA.sql
```

---

### Step 2: Restart Backend Server

**IMPORTANT**: You MUST restart the backend server for the transaction fix to work!

```bash
cd backend

# Stop the current server (press Ctrl+C in the terminal)

# Start it again
npm start
```

You should see:
```
🚀 SRMS Backend server running on port 5000
📊 Environment: development
✅ Database connected successfully to school_system
```

---

### Step 3: Refresh Frontend

**IMPORTANT**: Clear your browser cache to get the gender field fix!

**Option 1 - Hard Refresh**:
- Windows/Linux: Press `Ctrl + Shift + R`
- Mac: Press `Cmd + Shift + R`

**Option 2 - Clear Cache**:
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

### Step 4: Test Teacher Creation

1. **Login as Admin**:
   - Username: `admin`
   - Password: `password123`

2. **Navigate to Manage Teachers**:
   - Click "Manage Teachers" from the dashboard

3. **Add a New Teacher**:
   - Click "+ Add Teacher"
   - Fill in the form:
     ```
     Teacher Name: John Smith
     Email: john.smith@school.edu
     Username: john.smith
     Password: password123
     Department: Mathematics (or any department)
     ```
   - Click "Add Teacher"

4. **Check Results**:
   - ✅ Should see "Teacher added successfully!" toast message
   - ✅ New teacher should appear in the table
   - ✅ Backend console should show:
     ```
     Creating teacher with data: { teacher_name: 'John Smith', ... }
     Transaction started
     User created with ID: X
     Teacher created with ID: Y
     Transaction committed
     Connection released
     ```

**If it fails**:
- Check backend console for error details
- Make sure you restarted the backend server
- Check that the username doesn't already exist

---

### Step 5: Test Student Creation

1. **Navigate to Manage Students**:
   - Click "Manage Students" from the dashboard

2. **Add a New Student**:
   - Click "+ Add Student"
   - Fill in the form:
     ```
     Student Name: Alice Johnson
     Gender: Female (this will send 'F' to the database)
     Student Code: STU001
     Class: Grade 9A (or any class)
     Date of Birth: 2008-01-15
     ```
   - Click "Add Student"

3. **Check Results**:
   - ✅ Should see "Student added successfully!" toast message
   - ✅ New student should appear in the table
   - ✅ Backend console should show:
     ```
     Creating student with data: { student_name: 'Alice Johnson', gender: 'F', ... }
     Gender value type: string Value: F Length: 1
     Inserting student with gender: F
     Student created with ID: X
     ```

**If it fails**:
- Check backend console for error details
- Make sure you refreshed the browser (hard refresh)
- Verify the gender value is 'M' or 'F' (not 'Male' or 'Female')

---

### Step 6: Test Department Loading

1. **Navigate to Manage Departments**:
   - Click "Manage Departments" from the dashboard

2. **Check Results**:
   - ✅ Should see 5 departments listed:
     - Mathematics
     - English
     - Biology
     - Chemistry
     - Physics
   - ✅ Browser console should show:
     ```
     Loading departments...
     Departments response: { success: true, departments: [...] }
     Departments loaded: 5
     ```

**If departments don't load**:
- Check browser console for errors
- Check backend console for errors
- Verify you're logged in as admin
- Run `node verify-database.js` to check if departments exist

---

## Troubleshooting

### Teacher Creation Still Fails

**Error**: "This command is not supported in the prepared statement protocol yet"

**Solution**:
1. Make sure you restarted the backend server (Ctrl+C then `npm start`)
2. Check that `backend/controllers/teacherController.js` uses `connection.query()` not `connection.execute()`
3. Clear any PM2 or nodemon cache if using those

---

### Student Creation Still Fails

**Error**: "Data truncated for column 'gender' at row 1"

**Solution**:
1. Make sure you did a hard refresh in the browser (Ctrl+Shift+R)
2. Check browser DevTools > Network tab > Look at the POST request to `/api/students`
3. Verify the request body shows `"gender": "M"` or `"gender": "F"` (not "Male" or "Female")
4. If still showing wrong values, clear browser cache completely

---

### Departments Don't Load

**Possible Causes**:
1. Not logged in or token expired - Try logging out and back in
2. Database doesn't have departments - Run `node verify-database.js`
3. Backend route not configured - Check `backend/server.js` has `/api/departments` route

**Solution**:
```bash
# Verify database has departments
cd backend
node verify-database.js

# If no departments found, run the SQL script in MySQL:
# database/INSERT_ALL_DATA.sql
```

---

## Console Logs to Watch For

### Successful Teacher Creation:
```
Creating teacher with data: { teacher_name: '...', email: '...', ... }
Transaction started
User created with ID: X
Teacher created with ID: Y
Transaction committed
Connection released
```

### Successful Student Creation:
```
Creating student with data: { student_name: '...', gender: 'M', ... }
Gender value type: string Value: M Length: 1
Inserting student with gender: M
Student created with ID: X
```

### Successful Department Loading:
```
Loading departments...
Departments response: { success: true, departments: [...] }
Departments loaded: 5
```

---

## Next Steps After Testing

Once all three operations work:

1. ✅ Mark Task 2.1 as complete (Database Integration)
2. ✅ Start Task 2.2 (Create sample data for testing)
3. Continue with Task 3 (Authentication System)
4. Continue with Task 4 (Role-Based Dashboard)

Refer to `.kiro/specs/student-academic-record-system/tasks.md` for the complete task list.

---

## Need Help?

If you're still experiencing issues after following these steps:

1. Run `node verify-database.js` and share the output
2. Share the backend console logs (full error messages)
3. Share the browser console logs (Network tab + Console tab)
4. Confirm you've restarted the backend and refreshed the browser

The detailed logging I added will help identify exactly where the problem is occurring.
