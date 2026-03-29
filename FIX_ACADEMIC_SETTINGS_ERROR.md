# Fix "Failed to Update Context" Error

## Problem

When trying to update academic settings, you see:
- "Failed to update context"
- "Failed to load current academic context"

## Root Cause

The `system_settings` table doesn't exist in the database.

---

## Solution 1: Automatic Fix (Recommended)

The system now creates the table automatically when the server starts!

### Steps:

1. **Restart Backend Server**:
   ```bash
   cd backend
   # Press Ctrl+C to stop
   npm start
   ```

2. **Check Console Output**:
   You should see:
   ```
   ⚠️  Creating system_settings table...
   ✅ system_settings table created
   ✅ Default settings initialized
   🚀 SRMS Backend server running on port 5000
   ```

3. **Test Academic Settings**:
   - Login as admin
   - Go to Academic Settings
   - Type year: `2024`
   - Select: `1st Semester`
   - Click "Update Academic Context"
   - Should work now!

---

## Solution 2: Manual Setup

If automatic creation doesn't work, create the table manually:

### Step 1: Run Initialization Script

```bash
cd backend
node init-settings.js
```

**Expected Output**:
```
🔧 Initializing system settings...

1. Checking if system_settings table exists...
   ⚠️  Table does not exist. Creating...
   ✅ Table created successfully

2. Checking default settings...
   ⚠️  No default settings found. Creating...
   ✅ Default settings created (year_id: 2, semester_id: 1)

3. Current settings:
   - Academic Year: 2024 (ID: 2)
   - Semester: 1st Semester (ID: 1)

✅ System settings initialized successfully!
```

### Step 2: Restart Backend

```bash
npm start
```

### Step 3: Test

- Go to Academic Settings
- Should load without errors now

---

## Solution 3: SQL Script

If both above solutions fail, run this SQL directly:

### In MySQL Workbench or Command Line:

```sql
USE school_system;

-- Create settings table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('current_year_id', '2', 'Current academic year ID'),
('current_semester_id', '1', 'Current semester ID')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Verify
SELECT * FROM system_settings;
```

**Expected Result**:
```
+------------+--------------------+---------------+---------------------------+
| setting_id | setting_key        | setting_value | description               |
+------------+--------------------+---------------+---------------------------+
|          1 | current_year_id    | 2             | Current academic year ID  |
|          2 | current_semester_id| 1             | Current semester ID       |
+------------+--------------------+---------------+---------------------------+
```

---

## Verify Setup

### Check if Table Exists:

```sql
USE school_system;
SHOW TABLES LIKE 'system_settings';
```

Should return:
```
+--------------------------------------+
| Tables_in_school_system (system_settings) |
+--------------------------------------+
| system_settings                      |
+--------------------------------------+
```

### Check Settings Data:

```sql
SELECT * FROM system_settings;
```

Should show 2 rows (current_year_id and current_semester_id).

---

## Common Errors and Solutions

### Error: "Table 'school_system.system_settings' doesn't exist"

**Solution**: Run Solution 2 or 3 above to create the table.

### Error: "Cannot add or update a child row: a foreign key constraint fails"

**Solution**: The year_id in settings doesn't exist in academic_years table.

Fix:
```sql
-- Check existing years
SELECT * FROM academic_years;

-- If no years exist, create one
INSERT INTO academic_years (year_name) VALUES ('2024');

-- Update settings to use existing year
UPDATE system_settings 
SET setting_value = (SELECT year_id FROM academic_years LIMIT 1)
WHERE setting_key = 'current_year_id';
```

### Error: "Failed to update context" (after table exists)

**Possible Causes**:
1. Invalid year format (not 4 digits)
2. Database connection issue
3. Backend not restarted

**Solutions**:
1. Make sure year is exactly 4 digits (e.g., 2024)
2. Check backend console for detailed error
3. Restart backend server
4. Check database connection in backend/.env

---

## Testing Checklist

After fixing:

- [ ] Backend starts without errors
- [ ] Can access Academic Settings page
- [ ] Current context loads (shows year and semester)
- [ ] Can type a year (e.g., 2024)
- [ ] Can select semester (1st or 2nd)
- [ ] Click "Update Academic Context" works
- [ ] Success message appears
- [ ] Current context updates on page

---

## Backend Console Logs

### Successful Startup:
```
🚀 SRMS Backend server running on port 5000
📊 Environment: development
✅ Database connected successfully to school_system
```

### With Auto-Creation:
```
⚠️  Creating system_settings table...
✅ system_settings table created
✅ Default settings initialized
🚀 SRMS Backend server running on port 5000
```

### Successful Update:
```
Updating context with: { year_name: '2024', semester_id: 1 }
Using existing academic year: 2024 with ID: 2
Context updated successfully
```

### With New Year Creation:
```
Updating context with: { year_name: '2025', semester_id: 1 }
Created new academic year: 2025 with ID: 4
Context updated successfully
```

---

## Quick Fix Summary

**Fastest Solution**:
1. Run: `cd backend && node init-settings.js`
2. Restart: `npm start`
3. Test: Go to Academic Settings

**If that doesn't work**:
1. Run SQL script (Solution 3)
2. Restart backend
3. Test

**Still not working?**
- Check backend console for errors
- Verify database connection
- Check if `academic_years` table has data
- Share backend console output for help

---

## Prevention

The system now automatically creates the settings table on startup, so this error shouldn't happen again after the first fix!

**What happens on startup**:
1. Server checks if `system_settings` table exists
2. If not, creates it automatically
3. Inserts default settings
4. Server starts normally

No manual setup needed for future deployments!
