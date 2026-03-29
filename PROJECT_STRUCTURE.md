# Student Academic Record Management System (SRMS)
## Complete Project Structure

```
SRMS/
├── backend/                          # Node.js + Express Backend
│   ├── config/
│   │   ├── database.js              # MySQL database connection
│   │   └── config.js                # App configuration
│   ├── controllers/
│   │   ├── studentController.js     # Student CRUD operations
│   │   ├── teacherController.js     # Teacher management
│   │   ├── classController.js       # Class management
│   │   ├── subjectController.js     # Subject management
│   │   ├── markController.js        # Mark entry and validation
│   │   ├── reportController.js      # Report generation
│   │   └── departmentController.js  # Department management
│   ├── models/
│   │   ├── Student.js               # Student model
│   │   ├── Teacher.js               # Teacher model
│   │   ├── Class.js                 # Class model
│   │   ├── Subject.js               # Subject model
│   │   ├── Mark.js                  # Mark model
│   │   ├── Department.js            # Department model
│   │   └── ClassSubjectTeacher.js   # Junction table model
│   ├── routes/
│   │   ├── students.js              # Student routes
│   │   ├── teachers.js              # Teacher routes
│   │   ├── classes.js               # Class routes
│   │   ├── subjects.js              # Subject routes
│   │   ├── marks.js                 # Mark routes
│   │   ├── reports.js               # Report routes
│   │   └── departments.js           # Department routes
│   ├── services/
│   │   ├── reportService.js         # Report generation logic
│   │   ├── rankingService.js        # Automatic ranking calculation
│   │   └── validationService.js     # Mark validation (max 100, pass 50%)
│   ├── middleware/
│   │   ├── errorHandler.js          # Error handling middleware
│   │   └── validation.js            # Input validation middleware
│   ├── database/
│   │   ├── schema.sql               # Database schema creation
│   │   └── seedData.sql             # Sample data insertion
│   ├── .env                         # Environment variables
│   ├── server.js                    # Express server entry point
│   └── package.json                 # Backend dependencies
│
├── frontend/                         # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Layout/
│   │   │   │   ├── Navbar.jsx       # Navigation component
│   │   │   │   ├── Sidebar.jsx      # Sidebar navigation
│   │   │   │   └── Header.jsx       # Page header
│   │   │   ├── Forms/
│   │   │   │   ├── StudentForm.jsx  # Student registration form
│   │   │   │   ├── TeacherForm.jsx  # Teacher form
│   │   │   │   ├── ClassForm.jsx    # Class creation form
│   │   │   │   ├── SubjectForm.jsx  # Subject form
│   │   │   │   └── MarkForm.jsx     # Mark entry form
│   │   │   ├── Tables/
│   │   │   │   ├── StudentTable.jsx # Student data table
│   │   │   │   ├── TeacherTable.jsx # Teacher data table
│   │   │   │   ├── ClassTable.jsx   # Class data table
│   │   │   │   ├── SubjectTable.jsx # Subject data table
│   │   │   │   └── MarkTable.jsx    # Mark data table
│   │   │   ├── Reports/
│   │   │   │   ├── AcademicReport.jsx    # Main report component
│   │   │   │   ├── ReportTable.jsx       # Report table layout
│   │   │   │   ├── StudentReportCard.jsx # Individual student report
│   │   │   │   └── ClassSummary.jsx      # Class performance summary
│   │   │   └── Common/
│   │   │       ├── Loading.jsx      # Loading spinner
│   │   │       ├── Modal.jsx        # Modal component
│   │   │       └── Button.jsx       # Reusable button
│   │   ├── pages/                   # Main application pages
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── Students/
│   │   │   │   ├── StudentList.jsx  # List all students
│   │   │   │   ├── StudentAdd.jsx   # Add new student
│   │   │   │   └── StudentEdit.jsx  # Edit student
│   │   │   ├── Teachers/
│   │   │   │   ├── TeacherList.jsx  # List all teachers
│   │   │   │   ├── TeacherAdd.jsx   # Add new teacher
│   │   │   │   └── TeacherEdit.jsx  # Edit teacher
│   │   │   ├── Classes/
│   │   │   │   ├── ClassList.jsx    # List all classes
│   │   │   │   ├── ClassAdd.jsx     # Add new class
│   │   │   │   └── ClassEdit.jsx    # Edit class
│   │   │   ├── Subjects/
│   │   │   │   ├── SubjectList.jsx  # List all subjects
│   │   │   │   ├── SubjectAdd.jsx   # Add new subject
│   │   │   │   └── SubjectEdit.jsx  # Edit subject
│   │   │   ├── Marks/
│   │   │   │   ├── MarkEntry.jsx    # Mark entry interface
│   │   │   │   └── MarkList.jsx     # View all marks
│   │   │   └── Reports/
│   │   │       ├── ReportGeneration.jsx # Report generation page
│   │   │       └── ReportView.jsx       # View generated reports
│   │   ├── services/                # API communication
│   │   │   ├── api.js               # Base API configuration
│   │   │   ├── studentService.js    # Student API calls
│   │   │   ├── teacherService.js    # Teacher API calls
│   │   │   ├── classService.js      # Class API calls
│   │   │   ├── subjectService.js    # Subject API calls
│   │   │   ├── markService.js       # Mark API calls
│   │   │   ├── reportService.js     # Report API calls
│   │   │   └── departmentService.js # Department API calls
│   │   ├── utils/
│   │   │   ├── validation.js        # Form validation utilities
│   │   │   ├── formatting.js        # Data formatting utilities
│   │   │   └── constants.js         # App constants
│   │   ├── styles/                  # CSS styles
│   │   │   ├── globals.css          # Global styles
│   │   │   ├── components.css       # Component styles
│   │   │   └── pages.css            # Page-specific styles
│   │   ├── App.jsx                  # Main App component
│   │   ├── App.css                  # App styles
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Base styles
│   ├── package.json                 # Frontend dependencies
│   └── vite.config.js              # Vite configuration
│
├── database/                        # Database files
│   ├── schema.sql                   # Complete database schema
│   ├── sample_data.sql              # Sample data for testing
│   └── README.md                    # Database setup instructions
│
├── docs/                           # Project documentation
│   ├── API_Documentation.md         # API endpoints documentation
│   ├── Database_Schema.md           # Database design documentation
│   ├── User_Manual.md              # User guide
│   └── Setup_Instructions.md        # Installation guide
│
├── README.md                       # Project overview
└── .gitignore                      # Git ignore file
```

## Core Features Implementation:

### 1. Student Management
- **Register Student**: Complete form with Name, Gender, ID, Grade, Academic Year, Semester
- **Student List**: View all registered students with search and filter
- **Student Profile**: Individual student details and academic history

### 2. Subject Management  
- **Core Subjects**: Maths, English, Biology, Chemistry, Physics (total mark = 100)
- **Scalable**: Easy to add new subjects for future expansion
- **Subject Assignment**: Link subjects to classes and teachers

### 3. Teacher Management
- **Department System**: Teachers belong to subject-based departments
- **Homeroom Assignment**: One homeroom teacher per class
- **Subject Teaching**: Teachers can teach multiple classes for their subject

### 4. Mark Management
- **Mark Entry**: Input student marks per subject
- **Validation**: Maximum mark = 100, Pass mark = 50%
- **Bulk Entry**: Efficient mark entry for entire classes

### 5. Report Generation
- **Academic Report**: Subject marks, Total (out of 500), Average, Rank, Status
- **Automatic Ranking**: System calculates student rankings
- **Print Ready**: Professional report format
- **Class Reports**: Summary reports for entire classes

## Technology Stack:
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Styling**: CSS3 + Responsive Design
- **API**: RESTful API architecture