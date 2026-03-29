# Restart Backend Server

## The Issue
The new "Submit to Homeroom" route was added but the server needs to be restarted to load it.

## How to Restart

### Option 1: If server is running in a terminal
1. Go to the terminal where the backend server is running
2. Press `Ctrl + C` to stop the server
3. Run `npm start` to restart it

### Option 2: If you don't see the server running
1. Open a new terminal
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Verify the Server Started

You should see:
```
🚀 SRMS Backend server running on port 5000
📊 Environment: development
✅ Database connected successfully to school_system
```

## Test the New Feature

After restarting, run the test:
```bash
cd backend
node test-submit-homeroom.js
```

This will:
1. Login as a teacher
2. Save marks as draft
3. Submit marks to homeroom teacher
4. Verify the status changed to 'submitted'

## What Was Added

### New Route:
```
POST /api/marks/submit-to-homeroom
```

### New Database Fields:
- `marks.status` - ENUM('draft', 'submitted')
- `marks.submitted_at` - TIMESTAMP

### New Functionality:
- Teachers can save marks as drafts
- Teachers can submit marks to homeroom teacher
- Homeroom teachers only see submitted marks
- Teachers can edit marks anytime

## Common Issues

### "Route not found" error
- **Cause**: Server not restarted after adding new route
- **Solution**: Restart the backend server

### "Failed to submit to homeroom teacher"
- **Cause**: No draft marks found to submit
- **Solution**: First save marks as draft, then submit

### "You are not assigned to teach this subject to this class"
- **Cause**: Teacher not assigned to the class/subject
- **Solution**: Admin must assign teacher via "Manage Classes"

## Files Modified
- `backend/controllers/markController.js` - Added submitToHomeroom function
- `backend/routes/markRoutes.js` - Added /submit-to-homeroom route
- `frontend/src/pages/MarkEntry.jsx` - Added submit to homeroom button
- `database/add_mark_status.sql` - Added status fields to marks table

## Next Steps

1. Restart backend server
2. Login as a teacher
3. Go to "Enter Marks"
4. Select a class and enter marks
5. Click "Save as Draft"
6. Click "Submit to Homeroom Teacher"
7. Verify success message

The feature is ready to use once the server is restarted!
