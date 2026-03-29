# Troubleshooting Login Issue

## Step 1: Test Database Connection

Run this command in the backend folder:
```bash
cd backend
node test-login.js
```

This will:
- Test database connection
- Show all users in the database
- Test if admin and teacher1 credentials work

## Step 2: Restart Backend Server

1. Stop the backend server (Ctrl+C)
2. Start it again:
   ```bash
   npm start
   ```

The CORS issue has been fixed to allow both port 3000 and 5173.

## Step 3: Check Backend Terminal Output

When you click "Sign In", watch the backend terminal. You should see:
```
=== LOGIN ATTEMPT ===
Username: admin
Password: ***
Request body: { username: 'admin', password: 'password123' }
✅ Database connection OK
Searching for user in database...
Query result count: 1
✅ User found: { user_id: 1, username: 'admin', role: 'admin', teacher_id: null }
✅ Login successful, sending response
```

## Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login
4. Look for any errors

Common errors:
- **CORS error**: Backend needs to be restarted after CORS fix
- **Network error**: Backend is not running or wrong port
- **401 Unauthorized**: Wrong username/password
- **500 Server error**: Database connection issue

## Step 5: Test API Directly

Open a new terminal and test the login endpoint directly:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"password123\"}"
```

You should get a response with `"success": true` and a token.

## Step 6: Verify Database Has Data

Connect to MySQL and check:
```bash
mysql -u root -p
```

Then run:
```sql
USE school_system;
SELECT * FROM users;
```

You should see users with usernames: admin, teacher1, teacher2, etc.

## Step 7: Check Frontend is Using Correct API URL

The frontend should be calling: `http://localhost:5000/api/auth/login`

Check the browser Network tab (F12 → Network) when you click Sign In.

## What I Fixed

1. **CORS Configuration**: Updated `backend/server.js` to allow both port 3000 and 5173
2. **Enhanced Logging**: Added detailed logging to `authController.js` to see exactly what's happening
3. **Test Script**: Created `test-login.js` to verify database connection and credentials

## Next Steps

1. Run `node test-login.js` in backend folder
2. Restart backend server
3. Try to login again
4. Share the backend terminal output with me if it still fails
