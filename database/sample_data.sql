-- Sample Data for Student Record Management System
-- Based on new schema with users table

USE school_system;

----------------------------------------------------
-- INSERT USERS (Admin and Teachers)
----------------------------------------------------
-- Password for all users: password123 (in production, use bcrypt hashing)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@school.edu', 'password123', 'admin'),
('sarah.johnson', 'sarah.johnson@school.edu', 'password123', 'teacher'),
('michael.brown', 'michael.brown@school.edu', 'password123', 'teacher'),
('emily.davis', 'emily.davis@school.edu', 'password123', 'teacher'),
('robert.wilson', 'robert.wilson@school.edu', 'password123', 'teacher'),
('lisa.anderson', 'lisa.anderson@school.edu', 'password123', 'teacher'),
('jennifer.lee', 'jennifer.lee@school.edu', 'password123', 'teacher'),
('david.miller', 'david.miller@school.edu', 'password123', 'teacher'),
('maria.garcia', 'maria.garcia@school.edu', 'password123', 'teacher');

----------------------------------------------------
-- INSERT DEPARTMENTS
----------------------------------------------------
INSERT INTO departments (department_name) VALUES
('Mathematics'),
('English'),
('Biology'),
('Chemistry'),
('Physics');

----------------------------------------------------
-- INSERT TEACHERS (linked to users)
----------------------------------------------------
INSERT INTO teachers (teacher_name, email, department_id, user_id) VALUES
('Dr. Sarah Johnson', 'sarah.johnson@school.edu', 1, 2),
('Prof. Michael Brown', 'michael.brown@school.edu', 2, 3),
('Dr. Emily Davis', 'emily.davis@school.edu', 3, 4),
('Dr. Robert Wilson', 'robert.wilson@school.edu', 4, 5),
('Prof. Lisa Anderson', 'lisa.anderson@school.edu', 5, 6),
('Ms. Jennifer Lee', 'jennifer.lee@school.edu', 1, 7),
('Mr. David Miller', 'david.miller@school.edu', 2, 8),
('Dr. Maria Garcia', 'maria.garcia@school.edu', 3, 9);

----------------------------------------------------
-- INSERT SUBJECTS
----------------------------------------------------
INSERT INTO subjects (subject_name, department_id) VALUES
('Mathematics', 1),
('English', 2),
('Biology', 3),
('Chemistry', 4),
('Physics', 5);

----------------------------------------------------
-- INSERT GRADES (5-12)
----------------------------------------------------
INSERT INTO grades (grade_number) VALUES
(5), (6), (7), (8), (9), (10), (11), (12);

----------------------------------------------------
-- INSERT SECTIONS (A-D)
----------------------------------------------------
INSERT INTO sections (section_name) VALUES
('A'), ('B'), ('C'), ('D');

----------------------------------------------------
-- INSERT CLASSES (Grade + Section combinations)
----------------------------------------------------
-- Grade 9
INSERT INTO classes (grade_id, section_id, homeroom_teacher_id) VALUES
(5, 1, 1),  -- Grade 9A - Dr. Sarah Johnson
(5, 2, 2);  -- Grade 9B - Prof. Michael Brown

-- Grade 10
INSERT INTO classes (grade_id, section_id, homeroom_teacher_id) VALUES
(6, 1, 3),  -- Grade 10A - Dr. Emily Davis
(6, 2, 4);  -- Grade 10B - Dr. Robert Wilson

-- Grade 11
INSERT INTO classes (grade_id, section_id, homeroom_teacher_id) VALUES
(7, 1, 5),  -- Grade 11A - Prof. Lisa Anderson
(7, 2, 6);  -- Grade 11B - Ms. Jennifer Lee

-- Grade 12
INSERT INTO classes (grade_id, section_id, homeroom_teacher_id) VALUES
(8, 1, 7),  -- Grade 12A - Mr. David Miller
(8, 2, 8);  -- Grade 12B - Dr. Maria Garcia

----------------------------------------------------
-- INSERT ACADEMIC YEARS
----------------------------------------------------
INSERT INTO academic_years (year_name) VALUES
('2023'), ('2024'), ('2025');

----------------------------------------------------
-- INSERT SEMESTERS
----------------------------------------------------
INSERT INTO semesters (semester_name) VALUES
('Semester 1'), ('Semester 2');

----------------------------------------------------
-- INSERT STUDENTS
----------------------------------------------------
-- Grade 9A Students
INSERT INTO students (student_name, gender, student_code, class_id, date_of_birth, enrollment_date) VALUES
('STUD 1', 'M', 'ABC001/16', 1, '2008-01-15', '2024-01-10'),
('STUD 2', 'F', 'ABC002/16', 1, '2008-03-22', '2024-01-10'),
('STUD 3', 'M', 'ABC003/16', 1, '2008-05-10', '2024-01-10'),
('STUD 4', 'F', 'ABC004/16', 1, '2008-07-18', '2024-01-10');

-- Grade 9B Students
INSERT INTO students (student_name, gender, student_code, class_id, date_of_birth, enrollment_date) VALUES
('John Doe', 'M', 'ABC005/16', 2, '2008-02-20', '2024-01-10'),
('Jane Smith', 'F', 'ABC006/16', 2, '2008-04-15', '2024-01-10'),
('Michael Johnson', 'M', 'ABC007/16', 2, '2008-06-25', '2024-01-10'),
('Emily Brown', 'F', 'ABC008/16', 2, '2008-08-30', '2024-01-10');

-- Grade 10A Students
INSERT INTO students (student_name, gender, student_code, class_id, date_of_birth, enrollment_date) VALUES
('David Wilson', 'M', 'ABC009/16', 3, '2007-01-12', '2024-01-10'),
('Sarah Davis', 'F', 'ABC010/16', 3, '2007-03-18', '2024-01-10'),
('Robert Miller', 'M', 'ABC011/16', 3, '2007-05-22', '2024-01-10'),
('Lisa Anderson', 'F', 'ABC012/16', 3, '2007-07-28', '2024-01-10');

-- Grade 10B Students
INSERT INTO students (student_name, gender, student_code, class_id, date_of_birth, enrollment_date) VALUES
('James Taylor', 'M', 'ABC013/16', 4, '2007-02-14', '2024-01-10'),
('Maria Garcia', 'F', 'ABC014/16', 4, '2007-04-20', '2024-01-10'),
('Christopher Martinez', 'M', 'ABC015/16', 4, '2007-06-25', '2024-01-10'),
('Jessica Rodriguez', 'F', 'ABC016/16', 4, '2007-08-30', '2024-01-10');

----------------------------------------------------
-- INSERT TEACHER ASSIGNMENTS (Who teaches what to which class)
----------------------------------------------------
-- Grade 9A Assignments (class_id = 1) for year 2024 (year_id = 2)
INSERT INTO teacher_assignments (teacher_id, subject_id, class_id, year_id) VALUES
(1, 1, 1, 2),  -- Dr. Sarah Johnson teaches Mathematics to 9A
(2, 2, 1, 2),  -- Prof. Michael Brown teaches English to 9A
(3, 3, 1, 2),  -- Dr. Emily Davis teaches Biology to 9A
(4, 4, 1, 2),  -- Dr. Robert Wilson teaches Chemistry to 9A
(5, 5, 1, 2);  -- Prof. Lisa Anderson teaches Physics to 9A

-- Grade 9B Assignments (class_id = 2)
INSERT INTO teacher_assignments (teacher_id, subject_id, class_id, year_id) VALUES
(6, 1, 2, 2),  -- Ms. Jennifer Lee teaches Mathematics to 9B
(7, 2, 2, 2),  -- Mr. David Miller teaches English to 9B
(8, 3, 2, 2),  -- Dr. Maria Garcia teaches Biology to 9B
(4, 4, 2, 2),  -- Dr. Robert Wilson teaches Chemistry to 9B
(5, 5, 2, 2);  -- Prof. Lisa Anderson teaches Physics to 9B

-- Grade 10A Assignments (class_id = 3)
INSERT INTO teacher_assignments (teacher_id, subject_id, class_id, year_id) VALUES
(1, 1, 3, 2),  -- Dr. Sarah Johnson teaches Mathematics to 10A
(2, 2, 3, 2),  -- Prof. Michael Brown teaches English to 10A
(3, 3, 3, 2),  -- Dr. Emily Davis teaches Biology to 10A
(4, 4, 3, 2),  -- Dr. Robert Wilson teaches Chemistry to 10A
(5, 5, 3, 2);  -- Prof. Lisa Anderson teaches Physics to 10A

-- Grade 10B Assignments (class_id = 4)
INSERT INTO teacher_assignments (teacher_id, subject_id, class_id, year_id) VALUES
(6, 1, 4, 2),  -- Ms. Jennifer Lee teaches Mathematics to 10B
(7, 2, 4, 2),  -- Mr. David Miller teaches English to 10B
(8, 3, 4, 2),  -- Dr. Maria Garcia teaches Biology to 10B
(4, 4, 4, 2),  -- Dr. Robert Wilson teaches Chemistry to 10B
(5, 5, 4, 2);  -- Prof. Lisa Anderson teaches Physics to 10B

----------------------------------------------------
-- INSERT SAMPLE MARKS (Grade 9A - Semester 1, Year 2024)
----------------------------------------------------
-- STUD 1 (student_id: 1) - Total: 372, Average: 74.4, Rank: 1, Status: PASS
INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark) VALUES
(1, 1, 1, 1, 2, 88),  -- Mathematics
(1, 2, 2, 1, 2, 74),  -- English
(1, 3, 3, 1, 2, 65),  -- Biology
(1, 4, 4, 1, 2, 90),  -- Chemistry
(1, 5, 5, 1, 2, 55);  -- Physics

-- STUD 2 (student_id: 2) - Total: 321, Average: 64.2, Rank: 2, Status: PASS
INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark) VALUES
(2, 1, 1, 1, 2, 77),  -- Mathematics
(2, 2, 2, 1, 2, 64),  -- English
(2, 3, 3, 1, 2, 55),  -- Biology
(2, 4, 4, 1, 2, 80),  -- Chemistry
(2, 5, 5, 1, 2, 45);  -- Physics

-- STUD 3 (student_id: 3) - Total: 270, Average: 54, Rank: 3, Status: PASS
INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark) VALUES
(3, 1, 1, 1, 2, 66),  -- Mathematics
(3, 2, 2, 1, 2, 54),  -- English
(3, 3, 3, 1, 2, 45),  -- Biology
(3, 4, 4, 1, 2, 70),  -- Chemistry
(3, 5, 5, 1, 2, 35);  -- Physics

-- STUD 4 (student_id: 4) - Total: 219, Average: 43.8, Rank: 4, Status: FAIL
INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark) VALUES
(4, 1, 1, 1, 2, 55),  -- Mathematics
(4, 2, 2, 1, 2, 44),  -- English
(4, 3, 3, 1, 2, 35),  -- Biology
(4, 4, 4, 1, 2, 60),  -- Chemistry
(4, 5, 5, 1, 2, 25);  -- Physics

----------------------------------------------------
-- INSERT SAMPLE MARKS (Grade 9B - Semester 1, Year 2024)
----------------------------------------------------
-- John Doe (student_id: 5)
INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark) VALUES
(5, 1, 6, 1, 2, 85),  -- Mathematics
(5, 2, 7, 1, 2, 78),  -- English
(5, 3, 8, 1, 2, 82),  -- Biology
(5, 4, 4, 1, 2, 88),  -- Chemistry
(5, 5, 5, 1, 2, 80);  -- Physics

-- Jane Smith (student_id: 6)
INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark) VALUES
(6, 1, 6, 1, 2, 92),  -- Mathematics
(6, 2, 7, 1, 2, 89),  -- English
(6, 3, 8, 1, 2, 94),  -- Biology
(6, 4, 4, 1, 2, 87),  -- Chemistry
(6, 5, 5, 1, 2, 90);  -- Physics
