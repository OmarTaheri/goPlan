-- 10. STUDENT TRANSCRIPTS (Amina only)
-- ==========================================================

INSERT INTO student_transcript (student_id, course_id, semester_id, grade, status, credits_earned) VALUES
-- Year 1 Fall
(23, 1, 1, 'A', 'COMPLETED', 1),   -- FYE 1101
(23, 3, 1, 'A', 'COMPLETED', 0),   -- FAS 0210
(23, 50, 1, 'A-', 'COMPLETED', 3), -- ENG 1301
(23, 92, 1, 'A', 'COMPLETED', 3),  -- MTH 1303 Calculus I
(23, 93, 1, 'A-', 'COMPLETED', 3), -- MTH 1304 Discrete Math
(23, 41, 1, 'A', 'COMPLETED', 4),  -- CSC 1401
(23, 10, 1, 'A-', 'COMPLETED', 2), -- Arabic
-- Year 1 Spring
(23, 2, 2, 'A', 'COMPLETED', 1),   -- FYE 1102
(23, 4, 2, 'A-', 'COMPLETED', 2),  -- FAS 1220
(23, 30, 2, 'A', 'COMPLETED', 3),  -- COM 1301
(23, 96, 2, 'A', 'COMPLETED', 3),  -- MTH 2301 Calculus II
(23, 116, 2, 'A-', 'COMPLETED', 4),-- PHY 1401
(23, 400, 2, 'A', 'COMPLETED', 3), -- CSC 2302 Data Structures
-- Year 2 Fall
(23, 53, 4, 'A-', 'COMPLETED', 3), -- ENG 2303
(23, 99, 4, 'A', 'COMPLETED', 3),  -- MTH 2320 Linear Algebra
(23, 117, 4, 'A-', 'COMPLETED', 4),-- PHY 1402
(23, 404, 4, 'A', 'COMPLETED', 3), -- CSC 2306 OOP
(23, 403, 4, 'A-', 'COMPLETED', 3),-- CSC 2305 Computer Arch
-- Year 2 Spring
(23, 100, 5, 'A', 'COMPLETED', 3), -- MTH 3301 Prob/Stats
(23, 111, 5, 'A-', 'COMPLETED', 4),-- BIO 1401
(23, 405, 5, 'A', 'COMPLETED', 3), -- CSC 3315 Languages
(23, 406, 5, 'A-', 'COMPLETED', 3),-- CSC 3323 Algorithms
(23, 60, 5, 'A', 'COMPLETED', 3),  -- History
-- Year 3 Fall
(23, 407, 7, 'A-', 'COMPLETED', 3),-- CSC 3324 Software Engineering
(23, 408, 7, 'A', 'COMPLETED', 3), -- CSC 3326 Databases
(23, 409, 7, 'A-', 'COMPLETED', 3),-- CSC 3351 Operating Systems
(23, 20, 7, 'A', 'COMPLETED', 2),  -- FRN 3210
(23, 70, 7, 'A-', 'COMPLETED', 3), -- Humanities
-- Year 3 Spring
(23, 410, 8, 'A', 'COMPLETED', 3), -- CSC 3371 Networks
(23, 411, 8, 'A-', 'COMPLETED', 3),-- CSC 3374 Distributed Prog
(23, 412, 8, 'A', 'COMPLETED', 3), -- CSC 4301 AI
(23, 420, 8, 'A-', 'COMPLETED', 3),-- EGR 2302 Eng Economics
(23, 80, 8, 'A', 'COMPLETED', 3),  -- Arts
-- Year 3 Summer (Internship)
(23, 423, 9, 'A', 'COMPLETED', 3), -- EGR 4300 Internship
-- Math Minor Courses
(23, 97, 5, 'A', 'COMPLETED', 3),  -- MTH 2303 Lin Alg & Matrix
(23, 98, 7, 'A-', 'COMPLETED', 3), -- MTH 2304 Diff Eq
(23, 101, 8, 'A', 'COMPLETED', 3), -- MTH 3302 Complex Variables
-- Year 4 Fall (Current Semester)
(23, 413, 10, 'IP', 'IN_PROGRESS', 0), -- CSC 4307 Agile/DevOps
(23, 414, 10, 'IP', 'IN_PROGRESS', 0), -- CSC 4308 Cybersecurity
(23, 424, 10, 'IP', 'IN_PROGRESS', 0), -- EGR 4402 Capstone
(23, 130, 10, 'IP', 'IN_PROGRESS', 0), -- Civic Engagement
(23, 120, 10, 'IP', 'IN_PROGRESS', 0), -- Social Science

-- ==========================================================
-- Youssef (CS Freshman - Only Fall 2024, First Semester)
-- ==========================================================
-- Fall 2024 (Current semester - First semester for Youssef)
(24, 1, 10, 'A', 'COMPLETED', 1),   -- FYE 1101 First Year Experience
(24, 3, 10, 'A-', 'COMPLETED', 0),  -- FAS 0210 Strategic Academic Skills
(24, 50, 10, 'B+', 'COMPLETED', 3), -- ENG 1301 English Composition
(24, 92, 10, 'A', 'COMPLETED', 3),  -- MTH 1303 Calculus I
(24, 93, 10, 'A-', 'COMPLETED', 3), -- MTH 1304 Discrete Math
(24, 41, 10, 'A', 'COMPLETED', 4),  -- CSC 1401 Computer Programming
(24, 10, 10, 'B', 'COMPLETED', 2);  -- ARB 1241 Arabic

-- ==========================================================
