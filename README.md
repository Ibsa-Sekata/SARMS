# Student Academic Record Management System (SRMS)

A comprehensive web-based Student Academic Record Management System built with React frontend and Node.js/Express backend.

## Features

- **Role-based Authentication**: Separate dashboards for Subject Teachers and Homeroom Teachers
- **Student Management**: Add, edit, and manage student records
- **Mark Entry**: Subject teachers can enter marks for their assigned classes
- **Report Generation**: Generate detailed student rosters with rankings and statistics
- **Interactive Dashboard**: Modern UI with charts and analytics
- **Print Functionality**: Print-ready academic reports

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- Git

### Database Setup
1. Create MySQL database named `SRMS`
2. Run the schema: `mysql -u root -p SRMS < database/schema.sql`
3. Insert sample data: `mysql -u root -p SRMS < database/sample_data.sql`

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Test Database Connection
```bash
cd backend
node test-db.js
```

## Login Credentials

**All teachers use the same password: `password123`**

### Sample Teacher Emails:
- **Homeroom Teachers** (can generate rosters):
  - sarah.johnson@school.edu (Grade 10A)
  - michael.brown@school.edu (Grade 10B)
  - emily.davis@school.edu (Grade 11A)

- **Subject Teachers** (can enter marks):
  - robert.wilson@school.edu (Chemistry)
  - lisa.anderson@school.edu (Physics)
  - jennifer.lee@school.edu (Mathematics)

## System Workflow

1. **Subject Teachers**: 
   - Login → Enter marks for assigned classes → Submit to homeroom teacher

2. **Homeroom Teachers**: 
   - Login → Manage students → Generate rosters and reports
   - View class statistics and performance analytics

## API Endpoints

- `POST /api/auth/login` - Teacher login
- `GET /api/auth/me` - Get current user
- `GET /api/reports/roster/:classId` - Generate student roster
- `GET /api/reports/class/:id/statistics` - Get class statistics

## Technology Stack

- **Frontend**: React, React Router, Axios, React Hot Toast
- **Backend**: Node.js, Express, MySQL2, JWT
- **Database**: MySQL
- **Styling**: Custom CSS with modern design

## Project Structure

```
├── backend/
│   ├── controllers/     # API controllers
│   ├── middleware/      # Authentication middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── config/         # Database configuration
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   └── services/   # API services
└── database/
    ├── schema.sql      # Database schema
    └── sample_data.sql # Sample data
```

## Troubleshooting

### Login Issues
1. Check database connection: `node backend/test-db.js`
2. Verify backend is running on port 5000
3. Ensure database has sample data
4. Use correct email format and password: `password123`

### Database Issues
1. Check MySQL service is running
2. Verify database credentials in `backend/.env`
3. Ensure SRMS database exists
4. Run schema and sample data scripts

## Development

- Backend runs on: http://localhost:5000
- Frontend runs on: http://localhost:3000
- API base URL: http://localhost:5000/api

## Support

For issues or questions, check the console logs and ensure:
1. Database is properly configured
2. All dependencies are installed
3. Both frontend and backend servers are running
4. Sample data is loaded in the database