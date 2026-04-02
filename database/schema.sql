-- Student Record Management System Database Schema
-- Based on the new architecture with separate users table

-- Create Database
CREATE DATABASE IF NOT EXISTS school_system;
USE school_system;

----------------------------------------------------
-- USERS TABLE (Admin / Teacher login)
----------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','teacher') NOT NULL
);

----------------------------------------------------
-- DEPARTMENTS
----------------------------------------------------
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL
);

----------------------------------------------------
-- TEACHERS
----------------------------------------------------
CREATE TABLE teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    department_id INT,
    user_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

----------------------------------------------------
-- SUBJECTS
----------------------------------------------------
CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

----------------------------------------------------
-- GRADES (5-12)
----------------------------------------------------
CREATE TABLE grades (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    grade_number INT NOT NULL UNIQUE
);

----------------------------------------------------
-- SECTIONS (A-D)
----------------------------------------------------
CREATE TABLE sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    section_name CHAR(1) NOT NULL UNIQUE
);

----------------------------------------------------
-- CLASSES (Grade + Section)
----------------------------------------------------
CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id INT,
    section_id INT,
    homeroom_teacher_id INT,
    FOREIGN KEY (grade_id) REFERENCES grades(grade_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
);

----------------------------------------------------
-- STUDENTS
----------------------------------------------------
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    gender ENUM('M','F'),
    student_code VARCHAR(20) UNIQUE,
    class_id INT,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE SET NULL
);

----------------------------------------------------
-- ACADEMIC YEAR
----------------------------------------------------
CREATE TABLE academic_years (
    year_id INT AUTO_INCREMENT PRIMARY KEY,
    year_name VARCHAR(20) NOT NULL UNIQUE
);

----------------------------------------------------
-- SEMESTERS
----------------------------------------------------
CREATE TABLE semesters (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    semester_name VARCHAR(20) NOT NULL UNIQUE
);

----------------------------------------------------
-- TEACHER ASSIGNMENTS
----------------------------------------------------
CREATE TABLE teacher_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    subject_id INT,
    class_id INT,
    year_id INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (year_id) REFERENCES academic_years(year_id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (teacher_id, subject_id, class_id, year_id)
);

----------------------------------------------------
-- MARKS TABLE
----------------------------------------------------
CREATE TABLE marks (
    mark_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    teacher_id INT,
    semester_id INT,
    year_id INT,
    mark INT CHECK (mark >= 0 AND mark <= 100),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE CASCADE,
    FOREIGN KEY (year_id) REFERENCES academic_years(year_id) ON DELETE CASCADE,
    UNIQUE KEY unique_mark (student_id, subject_id, semester_id, year_id)
);

----------------------------------------------------
-- SYSTEM SETTINGS (current year / semester for the app)
-- Seed values align with your academic_years / semesters rows.
----------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('current_year_id', '1', 'Current academic year ID'),
('current_semester_id', '1', 'Current semester ID');
---------
-- INDEXES FOR PERFORMANCE
----------------------------------------------------
CREATE INDEX idx_teachers_user ON teachers(user_id);
CREATE INDEX idx_teachers_dept ON teachers(department_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_subject ON marks(subject_id);
CREATE INDEX idx_marks_year_sem ON marks(year_id, semester_id);
CREATE INDEX idx_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_assignments_class ON teacher_assignments(class_id);
