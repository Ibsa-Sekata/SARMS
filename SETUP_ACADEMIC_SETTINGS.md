# Quick Setup Guide - Academic Settings

## Step 1: Create Settings Table

Run this SQL in MySQL Workbench or command line:

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

-- Insert default settings (optional - will be created automatically when you set year/semester)
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('current_year_id', '2', 'Current academic year ID'),
('current_semester_id', '1', 'Current semester ID')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
```

## Step 2: Restart Backend Server

```bash
cd backend
# Press Ctrl+C to stop if running
npm start
```

## Step 3: Test the Feature

1. **Login as Admin**:
   - Username: `admin`
   - Password: `password123`

2. **Go to Academic Settings**:
   - Click "Academic Settings" card on dashboard (⚙️ icon)

3. **Set Academic Year and Semester**:
   - Type the year: `2024` (or any 4-digit year)
   - Select semester: `1st Semester` or `2nd Semester`
   - Click "Update Academic Context"

4. **Verify**:
   - Should see success message
   - Current context should update
   - Year will be created if it doesn't exist

## How It Works

### Type Year (Not Select)
- You type the year as a 4-digit number (e.g., 2024, 2025)
- If the year doesn't exist in the database, it's created automatically
- Existing years are shown below the input field

### Fixed Semesters
- Only 2 options: "1st Semester" and "2nd Semester"
- No need to manage semesters in database
- Semester IDs are 1 and 2

### Auto-Create Years
- When you enter a new year and click update:
  1. System checks if year exists in `academic_years` table
  2. If not found, creates new row with that year
  3. Updates system settings to use the new year
  4. Year is now available for all operations

## Example Usage

### Start 2024 Academic Year
```
Year: 2024
Semester: 1st Semester
Click: Update Academic Context
```

### Move to 2nd Semester
```
Year: 2024
Semester: 2nd Semester
Click: Update Academic Context
```

### Start New Year 2025
```
Year: 2025
Semester: 1st Semester
Click: Update Academic Context
```

## Troubleshooting

### "Failed to load current academic context"

**Cause**: Settings table doesn't exist

**Solution**:
1. Run the SQL script above to create the table
2. Restart backend server
3. Refresh browser

### "Failed to update context"

**Cause**: Invalid year format or database error

**Solution**:
1. Make sure year is 4 digits (e.g., 2024)
2. Check backend console for detailed error
3. Verify database connection is working

### Year input shows error

**Cause**: Invalid year format

**Solution**:
- Enter exactly 4 digits
- Year should be between 2000 and 2100
- Examples: 2024, 2025, 2026

## What Changed

### Backend
- `settingsController.js`: 
  - Auto-creates years if they don't exist
  - Returns fixed semesters (1st and 2nd)
  - Handles "Not Set" state gracefully

### Frontend
- `AcademicSettings.jsx`:
  - Text input for year (not dropdown)
  - Fixed semester dropdown (1st/2nd only)
  - Shows existing years below input
  - Validates year format

## Benefits

1. **Easy Year Management**: Just type the year, no need to pre-create
2. **Simple Semesters**: Only 2 options, no confusion
3. **Auto-Creation**: Years are created on-the-fly
4. **No Setup Required**: Works immediately after table creation
5. **User-Friendly**: Clear instructions and validation

## Next Steps

After setting up academic context:
1. Create classes for the year
2. Assign teachers to classes
3. Add students
4. Teachers can enter marks for current year/semester
5. Generate reports for current context
