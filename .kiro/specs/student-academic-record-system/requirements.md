# Requirements Document

## Introduction

The Student Academic Record Management System (SRMS) is a web-based application that enables teachers to manage student academic records with role-based access control. The system supports two teacher roles: Subject Teachers who enter marks for their assigned subjects and classes, and Homeroom Teachers who manage class rosters, collect marks from all subject teachers, and generate comprehensive academic reports with automatic ranking. The system manages students across grades, tracks marks for five core subjects (Maths, English, Biology, Chemistry, Physics), validates mark entries, and generates reports showing subject marks, totals, averages, rankings, and pass/fail status.

## Glossary

- **SRMS**: The Student Academic Record Management System
- **Subject_Teacher**: A teacher assigned to teach specific subjects to specific classes, belongs to a department
- **Homeroom_Teacher**: A teacher assigned to manage one class, collects marks and generates reports
- **Student**: An enrolled individual with academic records in the system
- **Subject**: An academic course with a maximum mark of 100
- **Mark**: A numerical score between 0 and 100 for a student in a subject
- **Class**: A group of students identified by grade and section (e.g., Grade 9A)
- **Department**: An organizational unit named after a subject area
- **Academic_Year**: The year in which academic activities occur
- **Semester**: A half-year academic period (1 or 2)
- **Pass_Mark**: The minimum score of 50 out of 100 required to pass a subject
- **Rank**: The position of a student within their class based on total marks
- **Report**: A document showing student marks, total, average, rank, and pass/fail status
- **Roster**: A list of all students in a class with their complete mark records
- **Database**: The existing MySQL database with schema defined in schema.sql

## Requirements

### Requirement 1: User Authentication and Role-Based Access

**User Story:** As a teacher, I want to log in with my credentials and be directed to a role-appropriate dashboard, so that I can access only the features relevant to my role.

#### Acceptance Criteria

1. WHEN a teacher submits valid login credentials, THE SRMS SHALL authenticate the teacher and determine their role
2. WHEN a Subject_Teacher logs in successfully, THE SRMS SHALL redirect to the Subject Teacher Dashboard
3. WHEN a Homeroom_Teacher logs in successfully, THE SRMS SHALL redirect to the Homeroom Teacher Dashboard
4. WHEN invalid credentials are submitted, THE SRMS SHALL display an error message and prevent access
5. THE SRMS SHALL maintain the teacher session until logout or timeout

### Requirement 2: Student Registration and Management

**User Story:** As a Homeroom Teacher, I want to register and manage students in my class, so that I can maintain an accurate class roster.

#### Acceptance Criteria

1. WHEN a Homeroom_Teacher registers a new student, THE SRMS SHALL store the student name, gender, student ID, grade, academic year, and semester
2. THE SRMS SHALL assign the student to the Homeroom_Teacher's class upon registration
3. WHEN a Homeroom_Teacher adds a student to their class, THE SRMS SHALL update the student class assignment in the Database
4. WHEN a Homeroom_Teacher removes a student from their class, THE SRMS SHALL update the Database to reflect the removal
5. THE SRMS SHALL prevent Subject_Teachers from adding or removing students
6. THE SRMS SHALL store the enrollment date when a student is registered

### Requirement 3: Subject Management and Configuration

**User Story:** As a system administrator, I want the system to manage core subjects with extensibility for new subjects, so that the academic structure can adapt to curriculum changes.

#### Acceptance Criteria

1. THE SRMS SHALL support five core subjects: Maths, English, Biology, Chemistry, and Physics
2. THE SRMS SHALL assign a total mark value of 100 to each subject
3. THE SRMS SHALL define the pass mark as 50 out of 100 for all subjects
4. THE SRMS SHALL allow new subjects to be added to the Database
5. WHEN a new subject is added, THE SRMS SHALL assign a default total mark of 100
6. THE SRMS SHALL store subject information in the Database Subjects table

### Requirement 4: Teacher Assignment and Department Structure

**User Story:** As a system administrator, I want to assign teachers to departments and classes, so that teaching responsibilities are clearly defined.

#### Acceptance Criteria

1. THE SRMS SHALL assign each Subject_Teacher to exactly one department
2. THE SRMS SHALL name departments after their corresponding subjects
3. THE SRMS SHALL assign each Homeroom_Teacher to exactly one class
4. WHEN a teacher is assigned to teach a subject to a class, THE SRMS SHALL record the assignment in the Class_Subject_Teachers table
5. THE SRMS SHALL allow a Subject_Teacher to be assigned to multiple classes for their subject
6. THE SRMS SHALL prevent a Homeroom_Teacher from being assigned to multiple classes simultaneously

### Requirement 5: Subject Teacher Mark Entry and Viewing

**User Story:** As a Subject Teacher, I want to view only my assigned students and enter marks for my subject, so that I can record academic performance for my classes.

#### Acceptance Criteria

1. WHEN a Subject_Teacher views their dashboard, THE SRMS SHALL display only the classes assigned to that teacher
2. WHEN a Subject_Teacher selects a class, THE SRMS SHALL display only the students enrolled in that class
3. THE SRMS SHALL allow a Subject_Teacher to enter marks only for their assigned subject
4. WHEN a Subject_Teacher enters a mark, THE SRMS SHALL validate that the mark is between 0 and 100 inclusive
5. IF a mark is less than 0 or greater than 100, THEN THE SRMS SHALL reject the entry and display an error message
6. THE SRMS SHALL allow a Subject_Teacher to edit marks before submission
7. WHEN a Subject_Teacher records a mark, THE SRMS SHALL store the teacher ID as the recorded_by value
8. THE SRMS SHALL prevent a Subject_Teacher from viewing students in classes not assigned to them

### Requirement 6: Mark Submission to Homeroom Teacher

**User Story:** As a Subject Teacher, I want to submit all marks for a class at once to the homeroom teacher, so that marks are officially recorded and cannot be changed without authorization.

#### Acceptance Criteria

1. WHEN a Subject_Teacher completes mark entry for a class, THE SRMS SHALL provide a submit all marks function
2. WHEN marks are submitted, THE SRMS SHALL save all marks for that class and subject to the Database
3. WHEN marks are submitted, THE SRMS SHALL record the submission date in the Marks table
4. THE SRMS SHALL allow mark editing only before submission
5. WHEN marks are submitted, THE SRMS SHALL make the marks available to the Homeroom_Teacher

### Requirement 7: Homeroom Teacher Class Management

**User Story:** As a Homeroom Teacher, I want to manage my class roster and view all subject marks, so that I can maintain complete academic records for my students.

#### Acceptance Criteria

1. WHEN a Homeroom_Teacher views their dashboard, THE SRMS SHALL display their assigned class
2. THE SRMS SHALL allow a Homeroom_Teacher to add students to their class
3. THE SRMS SHALL allow a Homeroom_Teacher to remove students from their class
4. WHEN a Homeroom_Teacher views the roster, THE SRMS SHALL display all students in their class
5. WHEN a Homeroom_Teacher views student marks, THE SRMS SHALL display marks from all subjects for each student
6. THE SRMS SHALL display which Subject_Teacher recorded each mark
7. THE SRMS SHALL prevent a Homeroom_Teacher from viewing or managing classes not assigned to them

### Requirement 8: Mark Storage and Validation

**User Story:** As a system, I want to validate and store marks with proper constraints, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN a mark is entered, THE SRMS SHALL validate that the score is between 0 and 100 inclusive
2. THE SRMS SHALL store marks in the Database Marks table with student ID, subject ID, score, academic year, and semester
3. WHEN a mark is recorded, THE SRMS SHALL store the teacher ID who recorded the mark
4. THE SRMS SHALL enforce a maximum mark value of 100 for all subjects
5. THE SRMS SHALL enforce a minimum mark value of 0 for all subjects
6. IF a mark violates validation rules, THEN THE SRMS SHALL reject the entry and return an error message
7. THE SRMS SHALL allow only one mark per student per subject per semester per exam type

### Requirement 9: Report Generation with Ranking

**User Story:** As a Homeroom Teacher, I want to generate academic reports with automatic ranking, so that I can provide comprehensive performance summaries for students.

#### Acceptance Criteria

1. WHEN a Homeroom_Teacher requests a report, THE SRMS SHALL display subject marks for each of the five core subjects
2. THE SRMS SHALL calculate the total marks as the sum of all subject marks (maximum 500)
3. THE SRMS SHALL calculate the average as the total marks divided by the number of subjects
4. THE SRMS SHALL calculate the rank by comparing total marks of all students in the same class
5. WHEN calculating rank, THE SRMS SHALL assign rank 1 to the student with the highest total marks
6. THE SRMS SHALL determine pass/fail status as PASS if average is greater than or equal to 50, otherwise FAIL
7. THE SRMS SHALL display the report with columns: Subject Marks, Total, Average, Rank, and Status
8. THE SRMS SHALL allow the Homeroom_Teacher to print the generated report

### Requirement 10: Automatic Rank Calculation

**User Story:** As a Homeroom Teacher, I want student rankings to be calculated automatically based on total marks, so that I don't have to manually compute rankings.

#### Acceptance Criteria

1. WHEN a report is generated, THE SRMS SHALL calculate each student's total marks across all subjects
2. THE SRMS SHALL sort students by total marks in descending order within their class
3. THE SRMS SHALL assign rank 1 to the student with the highest total marks
4. WHEN two students have equal total marks, THE SRMS SHALL assign them the same rank
5. THE SRMS SHALL calculate ranks only within the same class, academic year, and semester
6. THE SRMS SHALL update ranks automatically when marks are modified

### Requirement 11: Pass/Fail Status Determination

**User Story:** As a Homeroom Teacher, I want the system to automatically determine pass/fail status, so that I can quickly identify students who need additional support.

#### Acceptance Criteria

1. WHEN calculating status, THE SRMS SHALL compute the average of all subject marks
2. THE SRMS SHALL set status to PASS if the average is greater than or equal to 50
3. THE SRMS SHALL set status to FAIL if the average is less than 50
4. THE SRMS SHALL display the status on the student report
5. THE SRMS SHALL use the pass mark threshold of 50 out of 100 for all subjects

### Requirement 12: Class Statistics and Overview

**User Story:** As a Homeroom Teacher, I want to view class-level statistics, so that I can understand overall class performance.

#### Acceptance Criteria

1. WHEN a Homeroom_Teacher views class statistics, THE SRMS SHALL display the total number of students in the class
2. THE SRMS SHALL calculate and display the class average across all subjects
3. THE SRMS SHALL display the number of students with PASS status
4. THE SRMS SHALL display the number of students with FAIL status
5. THE SRMS SHALL calculate statistics only for students in the Homeroom_Teacher's assigned class

### Requirement 13: Database Integration and Schema Compliance

**User Story:** As a developer, I want the system to use the existing database schema, so that data consistency is maintained across the application.

#### Acceptance Criteria

1. THE SRMS SHALL use the existing Database schema defined in schema.sql
2. THE SRMS SHALL store department information in the Departments table
3. THE SRMS SHALL store teacher information in the Teachers table
4. THE SRMS SHALL store class information in the Classes table
5. THE SRMS SHALL store student information in the Students table
6. THE SRMS SHALL store subject information in the Subjects table
7. THE SRMS SHALL store mark information in the Marks table
8. THE SRMS SHALL store teacher-class-subject assignments in the Class_Subject_Teachers table
9. THE SRMS SHALL respect all foreign key constraints defined in the Database schema
10. THE SRMS SHALL utilize the existing database views: student_details, teacher_details, and student_performance

### Requirement 14: Frontend User Interface Implementation

**User Story:** As a developer, I want to rebuild the frontend with React, so that the user interface is modern and maintainable.

#### Acceptance Criteria

1. THE SRMS SHALL implement the user interface using React framework
2. THE SRMS SHALL provide a login page for teacher authentication
3. THE SRMS SHALL provide a Subject Teacher Dashboard with class and student views
4. THE SRMS SHALL provide a Homeroom Teacher Dashboard with roster and report generation features
5. THE SRMS SHALL provide forms for mark entry with client-side validation
6. THE SRMS SHALL provide a report generation interface with print functionality
7. THE SRMS SHALL display error messages for validation failures
8. THE SRMS SHALL provide navigation between different views based on teacher role

### Requirement 15: Mark Entry Form Validation

**User Story:** As a Subject Teacher, I want immediate feedback when entering invalid marks, so that I can correct errors before submission.

#### Acceptance Criteria

1. WHEN a Subject_Teacher enters a mark in the form, THE SRMS SHALL validate the input in real-time
2. IF the mark is less than 0, THEN THE SRMS SHALL display an error message "Mark must be at least 0"
3. IF the mark is greater than 100, THEN THE SRMS SHALL display an error message "Mark cannot exceed 100"
4. IF the mark is not a number, THEN THE SRMS SHALL display an error message "Mark must be a valid number"
5. THE SRMS SHALL prevent form submission when validation errors exist
6. THE SRMS SHALL clear error messages when valid input is entered

### Requirement 16: Academic Year and Semester Management

**User Story:** As a teacher, I want to work with specific academic years and semesters, so that records are organized by time period.

#### Acceptance Criteria

1. THE SRMS SHALL associate each student with an academic year and semester
2. THE SRMS SHALL associate each mark with an academic year and semester
3. THE SRMS SHALL allow teachers to filter views by academic year and semester
4. THE SRMS SHALL support semester values of 1 and 2 only
5. WHEN generating reports, THE SRMS SHALL include only marks from the specified academic year and semester
6. THE SRMS SHALL display the academic year and semester on all reports

### Requirement 17: Teacher-Class-Subject Assignment Tracking

**User Story:** As a system administrator, I want to track which teacher teaches which subject to which class, so that access control and mark attribution are accurate.

#### Acceptance Criteria

1. THE SRMS SHALL record teacher-class-subject assignments in the Class_Subject_Teachers table
2. WHEN a Subject_Teacher is assigned to teach a subject to a class, THE SRMS SHALL store the class ID, subject ID, teacher ID, and academic year
3. THE SRMS SHALL use these assignments to determine which students a Subject_Teacher can view
4. THE SRMS SHALL use these assignments to determine which subjects a Subject_Teacher can enter marks for
5. THE SRMS SHALL prevent duplicate assignments for the same class, subject, and academic year
6. THE SRMS SHALL allow a Subject_Teacher to be assigned to multiple classes for the same subject

### Requirement 18: Report Printing and Export

**User Story:** As a Homeroom Teacher, I want to print student reports, so that I can provide physical copies to students and parents.

#### Acceptance Criteria

1. WHEN a Homeroom_Teacher generates a report, THE SRMS SHALL provide a print function
2. WHEN the print function is activated, THE SRMS SHALL format the report for printing
3. THE SRMS SHALL include all report data in the printed version: student name, subject marks, total, average, rank, and status
4. THE SRMS SHALL include the academic year and semester on the printed report
5. THE SRMS SHALL include the class information on the printed report
6. THE SRMS SHALL format the printed report in a readable layout

### Requirement 19: Student Enrollment Information Display

**User Story:** As a Homeroom Teacher, I want to view student enrollment information, so that I can verify student details and enrollment dates.

#### Acceptance Criteria

1. WHEN a Homeroom_Teacher views a student record, THE SRMS SHALL display the student name
2. THE SRMS SHALL display the student gender
3. THE SRMS SHALL display the student ID
4. THE SRMS SHALL display the student grade
5. THE SRMS SHALL display the student academic year
6. THE SRMS SHALL display the student semester
7. THE SRMS SHALL display the student enrollment date
8. THE SRMS SHALL retrieve this information from the Database Students table

### Requirement 20: Subject Scalability and Extensibility

**User Story:** As a system administrator, I want to add new subjects to the system, so that the curriculum can evolve without code changes.

#### Acceptance Criteria

1. THE SRMS SHALL allow new subjects to be added to the Database Subjects table
2. WHEN a new subject is added, THE SRMS SHALL automatically include it in mark entry forms
3. WHEN a new subject is added, THE SRMS SHALL automatically include it in report generation
4. WHEN a new subject is added, THE SRMS SHALL apply the same validation rules (0-100 marks)
5. THE SRMS SHALL calculate totals and averages including all subjects in the Database
6. THE SRMS SHALL not require code changes when new subjects are added

### Requirement 21: Teacher Primary Subject Assignment

**User Story:** As a system administrator, I want to assign a primary subject to each teacher when they are created, so that teacher-class assignments are streamlined and subject selection is automatically determined.

#### Acceptance Criteria

1. WHEN a teacher is created, THE SRMS SHALL require the administrator to assign a primary subject to the teacher
2. THE SRMS SHALL store the primary subject assignment in the Teachers table subject_id field
3. WHEN an administrator assigns a teacher to a class, THE SRMS SHALL automatically select the teacher's primary subject
4. THE SRMS SHALL display the auto-selected subject as read-only or hidden in the teacher-class assignment form
5. THE SRMS SHALL validate that the subject_id references a valid subject in the Subjects table
6. THE SRMS SHALL allow administrators to view a teacher's primary subject in the teacher management interface
7. THE SRMS SHALL prevent teacher creation without a primary subject assignment
8. WHEN displaying teacher information, THE SRMS SHALL include the primary subject name alongside teacher details
