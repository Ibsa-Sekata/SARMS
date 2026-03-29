# Academic Settings Management Guide

## Overview

I've implemented a system for administrators to manage the current academic year and semester. This setting affects all operations throughout the system including mark entry, reports, and teacher assignments.

---

## Features Implemented

### 1. System Settings Table

**Database Table**: `system_settings`

Stores system-wide configuration:
- `current_year_id` - The active academic year
- `current_semester_id` - The active semester

**Default Values**:
- Academic Year: 2024 (year_id = 2)
- Semester: Semester 1 (semester_id = 1)

---

### 2. Academic Settings Page

**Location**: Admin Dashboard → Academic Settings (⚙️ icon)

**Features**:
- View current academic year and semester
- Change academic year
- Change semester
- See information about how changes affect the system

---

## How It Works

### Current Academic Context

The system maintains a "current context" that determines:

1. **Mark Entry**: Teachers enter marks for the current year/semester
2. **Reports**: Reports are generated for the current year/semester
3. **Teacher Assignments**: Assignments are filtered by current year
4. **Data Display**: All data is scoped to the current context

### Changing the Context

When admin changes the academic year or semester:
- All teachers will enter marks for the new context
- Reports will show data for the new context
- Previous data remains intact (not deleted)
- System-wide change affects all users immediately

---

## Database Setup

### Step 1: Create Settings Table

Run this SQL script in MySQL:

```bash
# In MySQL Workbench or command line:
# Run: database/add_settings_table.sql
```

Or manually:

```sql
USE school_system;

CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('current_year_id', '2', 'Current academic year ID'),
('current_semester_id', '1', 'Current semester ID')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
```

---

## API Endpoints

### Get Current Context
```
GET /api/settings/context
```

**Response**:
```json
{
  "success": true,
  "context": {
    "year_id": 2,
    "year_name": "2024",
    "semester_id": 1,
    "semester_name": "Semester 1"
  }
}
```

### Update Current Context
```
PUT /api/settings/context
```

**Request Body**:
```json
{
  "year_id": 2,
  "semester_id": 2
}
```

**Response**:
```json
{
  "success": true,
  "message": "Academic context updated successfully"
}
```

### Get All Academic Years
```
GET /api/settings/years
```

**Response**:
```json
{
  "success": true,
  "years": [
    { "year_id": 1, "year_name": "2023" },
    { "year_id": 2, "year_name": "2024" },
    { "year_id": 3, "year_name": "2025" }
  ]
}
```

### Get All Semesters
```
GET /api/settings/semesters
```

**Response**:
```json
{
  "success": true,
  "semesters": [
    { "semester_id": 1, "semester_name": "Semester 1" },
    { "semester_id": 2, "semester_name": "Semester 2" }
  ]
}
```

---

## Usage Workflow

### Step 1: Access Academic Settings

1. Login as admin
2. Go to Dashboard
3. Click "Academic Settings" card (⚙️ icon)

### Step 2: View Current Context

The page displays:
- Current Academic Year (e.g., "2024")
- Current Semester (e.g., "Semester 1")

### Step 3: Change Academic Context

1. Select new Academic Year from dropdown
2. Select new Semester from dropdown
3. Click "Update Academic Context"
4. Confirm success message

### Step 4: Verify Changes

- Dashboard will show updated year/semester
- Teachers will see new context when entering marks
- Reports will generate for new context

---

## Example Scenarios

### Scenario 1: Start of New Semester

**Current**: 2024, Semester 1
**Action**: Change to 2024, Semester 2

**Steps**:
1. Go to Academic Settings
2. Keep Year: 2024
3. Change Semester: Semester 2
4. Click Update

**Result**:
- Teachers can now enter marks for Semester 2
- Semester 1 marks remain in database
- Reports can be generated for Semester 2

---

### Scenario 2: Start of New Academic Year

**Current**: 2024, Semester 2
**Action**: Change to 2025, Semester 1

**Steps**:
1. Go to Academic Settings
2. Change Year: 2025
3. Change Semester: Semester 1
4. Click Update

**Result**:
- New academic year begins
- All 2024 data remains intact
- Teachers enter marks for 2025
- New teacher assignments for 2025

---

### Scenario 3: View Previous Data

**Current**: 2025, Semester 1
**Need**: View 2024 reports

**Steps**:
1. Go to Academic Settings
2. Change Year: 2024
3. Change Semester: 1 or 2
4. Click Update
5. Generate reports (will show 2024 data)
6. Change back to 2025 when done

---

## Impact on System Components

### Mark Entry
- Teachers enter marks for current year/semester
- Cannot enter marks for past/future periods
- Each mark is tagged with year_id and semester_id

### Reports
- Generated for current year/semester
- Historical reports require changing context
- Rankings calculated within current context

### Teacher Assignments
- Filtered by current year
- Assignments are year-specific
- Same teacher can have different assignments per year

### Student Records
- Students remain in system across years
- Marks are separated by year/semester
- Promotion to next grade handled manually

---

## Files Created/Modified

### Backend
- `backend/controllers/settingsController.js` - NEW - Settings management
- `backend/routes/settingsRoutes.js` - NEW - Settings routes
- `backend/server.js` - Added settings route

### Frontend
- `frontend/src/pages/Admin/AcademicSettings.jsx` - NEW - Settings page
- `frontend/src/App.jsx` - Added settings route
- `frontend/src/App.css` - Added settings styles
- `frontend/src/pages/Dashboard.jsx` - Added settings link

### Database
- `database/add_settings_table.sql` - NEW - Settings table creation

---

## Testing Checklist

### Database Setup
- [ ] Settings table created
- [ ] Default values inserted (year_id=2, semester_id=1)
- [ ] Can query settings table

### API Endpoints
- [ ] GET /api/settings/context returns current context
- [ ] GET /api/settings/years returns all years
- [ ] GET /api/settings/semesters returns all semesters
- [ ] PUT /api/settings/context updates context

### Frontend
- [ ] Academic Settings page loads
- [ ] Current context displays correctly
- [ ] Dropdowns populate with years and semesters
- [ ] Can change year and semester
- [ ] Success message appears after update
- [ ] Dashboard shows settings link for admin

### System Integration
- [ ] Mark entry uses current context
- [ ] Reports use current context
- [ ] Teacher assignments filter by current year
- [ ] Changing context affects all users

---

## Important Notes

1. **Data Persistence**: Changing the context does NOT delete any data
2. **System-Wide**: Changes affect all users immediately
3. **Admin Only**: Only administrators can change academic settings
4. **Validation**: System validates year and semester IDs exist
5. **Atomic Updates**: Both year and semester updated together

---

## Troubleshooting

### "Failed to load current academic context"
- Check if settings table exists
- Verify default values are inserted
- Check backend console for errors

### "Failed to update context"
- Verify year_id and semester_id are valid
- Check if values exist in academic_years and semesters tables
- Check backend console for detailed error

### Dropdowns are empty
- Run `node verify-database.js` to check data
- Verify academic_years table has data
- Verify semesters table has data

### Changes not reflecting
- Hard refresh browser (Ctrl+Shift+R)
- Check if update was successful (check success message)
- Verify database was actually updated

---

## Future Enhancements

Possible additions:
1. **Academic Year Management**: Add/edit academic years
2. **Semester Management**: Add/edit semesters
3. **Automatic Transitions**: Schedule automatic year/semester changes
4. **Notifications**: Alert users when context changes
5. **Audit Log**: Track who changed settings and when
6. **Rollback**: Ability to revert to previous context

---

## Support

If you encounter issues:

1. **Run database setup**:
   ```bash
   # In MySQL Workbench:
   # Run: database/add_settings_table.sql
   ```

2. **Restart backend server**:
   ```bash
   cd backend
   npm start
   ```

3. **Hard refresh browser**:
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Verify database**:
   ```bash
   cd backend
   node verify-database.js
   ```

5. **Check console logs**:
   - Backend console for API errors
   - Browser console for frontend errors

---

## Quick Reference

**Default Context**:
- Year: 2024 (year_id = 2)
- Semester: Semester 1 (semester_id = 1)

**Admin Access**:
- Dashboard → Academic Settings (⚙️)

**Database Table**:
- `system_settings` - Stores current year and semester

**Key Endpoints**:
- GET `/api/settings/context` - Get current
- PUT `/api/settings/context` - Update current
- GET `/api/settings/years` - List years
- GET `/api/settings/semesters` - List semesters
