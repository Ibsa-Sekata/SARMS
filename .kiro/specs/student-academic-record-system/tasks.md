# Implementation Plan: Student Academic Record Management System

## Overview

This implementation plan creates a comprehensive web-based Student Academic Record Management System with role-based access control. The system features a React frontend, Node.js/Express backend, and MySQL database integration. The implementation follows a progressive approach, building core infrastructure first, then adding features incrementally with testing at each stage.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - [x] 1.1 Initialize backend Node.js/Express project structure
    - Create backend directory with proper folder structure (config, controllers, models, routes, middleware, services, utils)
    - Set up package.json with required dependencies (express, mysql2, cors, dotenv)
    - Create basic Express server setup in server.js
    - _Requirements: 13.1, 13.2, 14.1_

  - [x] 1.2 Initialize frontend React project structure
    - Create frontend directory with Vite + React setup
    - Set up package.json with required dependencies (react, react-router-dom, axios, vite)
    - Create basic component structure (components, pages, contexts, services, utils)
    - _Requirements: 14.1, 14.2_

  - [x] 1.3 Configure database connection and environment setup
    - Create MySQL connection pool configuration in config/db.js
    - Set up environment variables for database credentials
    - Create .env files for both frontend and backend
    - _Requirements: 13.1, 13.9_

- [-] 2. Database Integration and Sample Data
  - [x] 2.1 Integrate existing database schema
    - Connect to existing MySQL database using schema.sql
    - Create database models for all tables (Teachers, Students, Classes, Subjects, Marks, etc.)
    - Implement basic CRUD operations for each model
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [ ] 2.2 Create sample data for testing
    - Insert sample departments (Maths, English, Biology, Chemistry, Physics)
    - Create sample teachers with different roles (subject teachers and homeroom teachers)
    - Add sample classes with grade/section combinations
    - Insert sample students across different classes
    - Create sample teaching assignments in Class_Subject_Teachers table
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 17.1, 17.2_

  - [ ]* 2.3 Write unit tests for database models
    - Test CRUD operations for each model
    - Test foreign key constraints and data validation
    - Test database views (student_details, teacher_details, student_performance)
    - _Requirements: 13.9, 13.10_

- [ ] 3. Authentication System Implementation
  - [ ] 3.1 Implement backend authentication middleware
    - Create authentication middleware for token validation
    - Implement role-based authorization middleware
    - Create session management with token generation and validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 3.2 Create authentication API endpoints
    - POST /api/auth/login - Teacher login with email/password
    - POST /api/auth/logout - Session invalidation
    - GET /api/auth/me - Get current user info
    - Implement role determination logic (subject_teacher vs homeroom_teacher)
    - _Requirements: 1.1, 1.2, 1.3, 4.5, 4.6_

  - [ ] 3.3 Build frontend authentication system
    - Create AuthContext for global authentication state
    - Implement login form with validation
    - Create ProtectedRoute component for route protection
    - Set up axios interceptors for token management
    - _Requirements: 1.1, 1.2, 1.3, 14.2, 14.7_

  - [ ]* 3.4 Write authentication tests
    - Test login/logout functionality
    - Test role-based access control
    - Test token validation and expiration
    - _Requirements: 1.4, 1.5_

- [ ] 4. Role-Based Dashboard Implementation
  - [ ] 4.1 Create Subject Teacher Dashboard
    - Build STDashboard component showing assigned classes
    - Display only classes where teacher is assigned to teach their subject
    - Show class roster for each assigned class
    - Implement navigation to mark entry forms
    - _Requirements: 1.2, 5.1, 5.8, 14.3_

  - [ ] 4.2 Create Homeroom Teacher Dashboard
    - Build HTDashboard component showing assigned class
    - Display complete class roster with all student information
    - Show class statistics and performance overview
    - Implement navigation to roster management and report generation
    - _Requirements: 1.3, 7.1, 7.4, 7.7, 14.3_

  - [ ] 4.3 Implement role-based routing and navigation
    - Set up React Router with role-based route protection
    - Create navigation components that adapt to user role
    - Implement automatic redirection based on user role after login
    - _Requirements: 1.2, 1.3, 14.8_

  - [ ]* 4.4 Write dashboard component tests
    - Test role-based content rendering
    - Test navigation and routing behavior
    - Test data loading and error states
    - _Requirements: 1.2, 1.3_

- [ ] 5. Student Management System
  - [ ] 5.1 Implement student CRUD API endpoints
    - GET /api/students - List students with class/year/semester filters
    - GET /api/students/:id - Get individual student details
    - POST /api/students - Register new student (homeroom teachers only)
    - PUT /api/students/:id - Update student information
    - DELETE /api/students/:id - Remove student from class
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

  - [ ] 5.2 Build student registration and management forms
    - Create StudentForm component for adding/editing students
    - Implement form validation for required fields (name, gender, class, academic year, semester)
    - Add student enrollment date tracking
    - Create student list view with filtering capabilities
    - _Requirements: 2.1, 2.2, 2.6, 14.4, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ] 5.3 Implement class roster management for homeroom teachers
    - Create RosterManagement component for homeroom teachers
    - Allow adding students to assigned class
    - Allow removing students from assigned class
    - Display complete student information including enrollment details
    - _Requirements: 2.3, 2.4, 7.2, 7.3, 7.4_

  - [ ]* 5.4 Write student management tests
    - Test student CRUD operations
    - Test role-based access restrictions
    - Test form validation and error handling
    - _Requirements: 2.5, 7.7_

- [ ] 6. Mark Entry and Validation System
  - [ ] 6.1 Implement mark entry API endpoints
    - GET /api/marks - List marks with student/class/subject filters
    - POST /api/marks - Record individual mark
    - POST /api/marks/batch - Submit all marks for a class at once
    - PUT /api/marks/:id - Update mark before submission
    - DELETE /api/marks/:id - Delete mark before submission
    - _Requirements: 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 6.2 Create mark validation system
    - Implement frontend real-time validation (0-100 range, numeric input)
    - Create backend validation middleware for mark entries
    - Add business logic validation (teacher assignment, duplicate prevention)
    - Implement database-level constraints and triggers
    - _Requirements: 5.4, 5.5, 8.1, 8.2, 8.4, 8.5, 8.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ] 6.3 Build mark entry forms for subject teachers
    - Create MarkEntryForm component with student list and score inputs
    - Implement batch mark entry with validation feedback
    - Add mark submission functionality with confirmation
    - Show only students from assigned classes for the teacher's subject
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 5.8, 6.1, 6.5, 14.5, 17.3, 17.4_

  - [ ]* 6.4 Write mark entry validation tests
    - Test mark range validation (0-100)
    - Test duplicate mark prevention
    - Test teacher assignment validation
    - Test batch submission functionality
    - _Requirements: 8.6, 8.7_

- [ ] 7. Checkpoint - Core Functionality Validation
  - Ensure all authentication, role-based access, student management, and mark entry features work correctly
  - Verify database constraints and validation rules are enforced
  - Test user workflows for both subject teachers and homeroom teachers
  - Ask the user if questions arise about core functionality

- [ ] 8. Report Generation with Ranking System
  - [ ] 8.1 Implement ranking calculation algorithm
    - Create rankService.js with ranking calculation logic
    - Implement SQL-based ranking using window functions (DENSE_RANK)
    - Handle tie scenarios where students have equal total marks
    - Calculate rankings within class, academic year, and semester scope
    - _Requirements: 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 8.2 Build report generation API endpoints
    - GET /api/reports/student/:id - Generate individual student report
    - GET /api/reports/class/:id - Generate reports for all students in class
    - GET /api/reports/class/:id/statistics - Get class performance statistics
    - Include total marks, average, rank, and pass/fail status calculations
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7, 9.8, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 8.3 Create report display components
    - Build ReportCard component for individual student reports
    - Create ClassStatistics component for class performance overview
    - Display subject marks, totals, averages, rankings, and pass/fail status
    - Show class-level statistics (pass/fail counts, class average, subject statistics)
    - _Requirements: 9.7, 12.1, 12.2, 12.3, 12.4, 12.5, 14.6_

  - [ ]* 8.4 Write report generation tests
    - Test ranking algorithm with various scenarios including ties
    - Test total and average calculations
    - Test pass/fail status determination
    - Test class statistics calculations
    - _Requirements: 10.4, 11.2, 11.3_

- [ ] 9. Academic Year and Semester Management
  - [ ] 9.1 Implement academic period context and filtering
    - Create AcademicYearContext for managing current academic year and semester
    - Add academic year/semester filters to all relevant API endpoints
    - Ensure all data operations are scoped to specific academic periods
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [ ] 9.2 Update all components to use academic period context
    - Modify student lists, mark entry forms, and reports to filter by academic period
    - Add academic year/semester selectors to relevant interfaces
    - Ensure reports display the correct academic period information
    - _Requirements: 16.3, 16.5, 16.6_

  - [ ]* 9.3 Write academic period management tests
    - Test filtering by academic year and semester
    - Test academic period context functionality
    - Test data isolation between different academic periods
    - _Requirements: 16.1, 16.2, 16.4_

- [ ] 10. Print Functionality and Report Export
  - [ ] 10.1 Implement print-ready report formatting
    - Create PrintableReport component with print-optimized styling
    - Format reports for physical printing with proper layout and spacing
    - Include all required information (student details, marks, totals, rank, status)
    - Add academic year, semester, and class information to printed reports
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [ ] 10.2 Add print functionality to report interfaces
    - Integrate print functionality into report generation pages
    - Create print buttons and print preview capabilities
    - Ensure printed reports maintain proper formatting and readability
    - _Requirements: 9.8, 18.1_

  - [ ]* 10.3 Write print functionality tests
    - Test print formatting and layout
    - Test print button functionality
    - Test report content completeness in print format
    - _Requirements: 18.3, 18.4, 18.5, 18.6_

- [ ] 11. Subject Scalability and Extensibility
  - [ ] 11.1 Implement dynamic subject management
    - Create subject management API endpoints (GET, POST, PUT for subjects)
    - Build SubjectForm component for adding new subjects
    - Ensure mark entry forms automatically include new subjects
    - Update report generation to include all subjects dynamically
    - _Requirements: 3.4, 3.5, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [ ] 11.2 Update calculation logic for dynamic subjects
    - Modify total and average calculations to work with any number of subjects
    - Ensure ranking algorithms adapt to different subject combinations
    - Update validation rules to apply to all subjects consistently
    - _Requirements: 20.4, 20.5_

  - [ ]* 11.3 Write subject scalability tests
    - Test adding new subjects to the system
    - Test mark entry with different subject combinations
    - Test report generation with varying numbers of subjects
    - _Requirements: 20.2, 20.3, 20.6_

- [ ] 12. Teacher Assignment Management
  - [ ] 12.1 Implement teacher-class-subject assignment system
    - Create assignment API endpoints for managing Class_Subject_Teachers
    - Build interface for assigning teachers to teach subjects to classes
    - Implement validation to prevent duplicate assignments
    - Allow subject teachers to be assigned to multiple classes for their subject
    - _Requirements: 4.4, 4.5, 17.1, 17.2, 17.5, 17.6_

  - [ ] 12.2 Update access control based on assignments
    - Modify student and mark APIs to use assignment data for access control
    - Ensure subject teachers only see classes they're assigned to teach
    - Update mark entry permissions based on teaching assignments
    - _Requirements: 17.3, 17.4, 5.8_

  - [ ]* 12.3 Write assignment management tests
    - Test teacher assignment creation and validation
    - Test access control based on assignments
    - Test prevention of duplicate assignments
    - _Requirements: 17.5, 17.6_

- [ ] 13. Final Integration and Testing
  - [ ] 13.1 Implement comprehensive error handling
    - Add global error handling middleware for backend
    - Create error boundary components for frontend
    - Implement user-friendly error messages and notifications
    - Add logging for debugging and monitoring
    - _Requirements: 14.7_

  - [ ] 13.2 Add notification system
    - Create NotificationContext for toast notifications
    - Implement success, error, warning, and info notifications
    - Add notifications for all user actions (mark submission, student registration, etc.)
    - _Requirements: 14.7_

  - [ ] 13.3 Optimize performance and add caching
    - Implement report caching for frequently accessed data
    - Add database query optimization
    - Implement pagination for large data sets
    - Add loading states and spinners for better user experience
    - _Requirements: Performance optimization_

  - [ ]* 13.4 Write comprehensive integration tests
    - Test complete user workflows for both teacher roles
    - Test data consistency across all operations
    - Test error scenarios and edge cases
    - Test performance under load
    - _Requirements: System reliability_

- [ ] 14. Final Checkpoint and Deployment Preparation
  - Ensure all features work correctly end-to-end
  - Verify all requirements are implemented and tested
  - Test complete user workflows for both subject teachers and homeroom teachers
  - Prepare deployment configuration and documentation
  - Ask the user if questions arise about final implementation

- [ ] 15. Teacher-Subject Assignment Feature
  - [ ] 15.1 Database schema migration for teacher-subject assignment
    - Create migration script to add subject_id column to teachers table
    - Add foreign key constraint linking teachers.subject_id to subjects.subject_id
    - Add index on subject_id for performance
    - Update existing teachers with default subject assignments
    - Test migration script on development database
    - _Requirements: 21.1, 21.2_

  - [ ] 15.2 Backend API updates for teacher-subject management
    - Update Teacher model to include subject_id field
    - Modify POST /api/teachers endpoint to accept and validate subject_id
    - Modify PUT /api/teachers/:id endpoint to allow updating subject_id
    - Update GET /api/teachers endpoints to include subject information in response
    - Add validation for subject_id (required, must exist in subjects table)
    - Update teacher DTOs to include subject_id and subject_name
    - _Requirements: 21.3, 21.4, 21.5, 21.6_

  - [ ] 15.3 Frontend teacher management updates
    - Update ManageTeachers.jsx to add subject dropdown in teacher creation form
    - Fetch subjects list from API on component mount
    - Add subject_id to form state and submission
    - Display teacher's primary subject in teachers list
    - Add validation for required subject selection
    - Update teacher edit form to allow changing primary subject
    - _Requirements: 21.7, 21.8_

  - [ ] 15.4 Frontend teacher assignment auto-fill functionality
    - Update ManageClasses.jsx assignment form to auto-fill subject when teacher is selected
    - Fetch teacher details including subject_id when teacher is selected
    - Set subject field value to teacher's subject_id automatically
    - Make subject field read-only or display-only after auto-fill
    - Show visual indicator that subject was auto-selected
    - Allow manual override if needed (optional)
    - _Requirements: 21.7, 21.8_

  - [ ]* 15.5 Testing and validation for teacher-subject assignment
    - Test teacher creation with subject assignment
    - Test teacher assignment with auto-filled subject
    - Verify foreign key constraints work correctly
    - Test validation for invalid subject_id
    - Test updating teacher's primary subject
    - Verify existing functionality still works (backward compatibility)
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- The implementation follows a progressive approach: infrastructure → core features → advanced features → optimization
- All mark validation includes both frontend and backend validation for security
- Role-based access control is enforced at multiple levels (UI, API, database)
- The system is designed to be scalable with dynamic subject management
- Report generation includes comprehensive ranking and statistics calculations