-- 10. STUDENT TRANSCRIPTS
-- ==========================================================
-- Timeline: Fall 2025 is current semester (semester_id = 13)
-- Amina: Senior, enrolled Fall 2022 (semester_id = 4)
-- Youssef: Freshman, enrolled Fall 2025 (semester_id = 13)

INSERT INTO student_transcript (student_id, course_id, semester_id, grade, status, credits_earned) VALUES
-- ==========================================================
-- AMINA (CS Senior - enrolled Fall 2022, graduating Spring 2026)
-- ==========================================================

-- Year 1 Fall (Fall 2022 - semester_id = 4)
(23, 1, 4, 'A', 'COMPLETED', 1),   -- FYE 1101
(23, 3, 4, 'A', 'COMPLETED', 0),   -- FAS 0210
(23, 50, 4, 'A-', 'COMPLETED', 3), -- ENG 1301
(23, 92, 4, 'A', 'COMPLETED', 3),  -- MTH 1303 Calculus I
(23, 93, 4, 'A-', 'COMPLETED', 3), -- MTH 1304 Discrete Math
(23, 41, 4, 'A', 'COMPLETED', 4),  -- CSC 1401
(23, 10, 4, 'A-', 'COMPLETED', 2), -- Arabic

-- Year 1 Spring (Spring 2023 - semester_id = 5)
(23, 2, 5, 'A', 'COMPLETED', 1),   -- FYE 1102
(23, 4, 5, 'A-', 'COMPLETED', 2),  -- FAS 1220
(23, 30, 5, 'A', 'COMPLETED', 3),  -- COM 1301
(23, 96, 5, 'A', 'COMPLETED', 3),  -- MTH 2301 Calculus II
(23, 116, 5, 'A-', 'COMPLETED', 4),-- PHY 1401
(23, 400, 5, 'A', 'COMPLETED', 3), -- CSC 2302 Data Structures

-- Year 2 Fall (Fall 2023 - semester_id = 7)
(23, 53, 7, 'A-', 'COMPLETED', 3), -- ENG 2303
(23, 99, 7, 'A', 'COMPLETED', 3),  -- MTH 2320 Linear Algebra
(23, 117, 7, 'A-', 'COMPLETED', 4),-- PHY 1402
(23, 404, 7, 'A', 'COMPLETED', 3), -- CSC 2306 OOP
(23, 403, 7, 'A-', 'COMPLETED', 3),-- CSC 2305 Computer Arch

-- Year 2 Spring (Spring 2024 - semester_id = 8)
(23, 100, 8, 'A', 'COMPLETED', 3), -- MTH 3301 Prob/Stats
(23, 111, 8, 'A-', 'COMPLETED', 4),-- BIO 1401
(23, 405, 8, 'A', 'COMPLETED', 3), -- CSC 3315 Languages
(23, 406, 8, 'A-', 'COMPLETED', 3),-- CSC 3323 Algorithms
(23, 60, 8, 'A', 'COMPLETED', 3),  -- History

-- Year 3 Fall (Fall 2024 - semester_id = 10)
(23, 407, 10, 'A-', 'COMPLETED', 3),-- CSC 3324 Software Engineering
(23, 408, 10, 'A', 'COMPLETED', 3), -- CSC 3326 Databases
(23, 409, 10, 'A-', 'COMPLETED', 3),-- CSC 3351 Operating Systems
(23, 20, 10, 'A', 'COMPLETED', 2),  -- FRN 3210
(23, 70, 10, 'A-', 'COMPLETED', 3), -- Humanities

-- Year 3 Spring (Spring 2025 - semester_id = 11)
(23, 410, 11, 'A', 'COMPLETED', 3), -- CSC 3371 Networks
(23, 411, 11, 'A-', 'COMPLETED', 3),-- CSC 3374 Distributed Prog
(23, 412, 11, 'A', 'COMPLETED', 3), -- CSC 4301 AI
(23, 420, 11, 'A-', 'COMPLETED', 3),-- EGR 2302 Eng Economics
(23, 80, 11, 'A', 'COMPLETED', 3),  -- Arts

-- Year 3 Summer (Summer 2025 - semester_id = 12, Internship)
(23, 423, 12, 'A', 'COMPLETED', 3), -- EGR 4300 Internship

-- Math Minor Courses (distributed across semesters)
(23, 97, 8, 'A', 'COMPLETED', 3),  -- MTH 2303 Lin Alg & Matrix
(23, 98, 10, 'A-', 'COMPLETED', 3), -- MTH 2304 Diff Eq
(23, 101, 11, 'A', 'COMPLETED', 3), -- MTH 3302 Complex Variables

-- Year 4 Fall (Fall 2025 - semester_id = 13) - CURRENT SEMESTER
(23, 413, 13, 'IP', 'IN_PROGRESS', 0), -- CSC 4307 Agile/DevOps
(23, 414, 13, 'IP', 'IN_PROGRESS', 0), -- CSC 4308 Cybersecurity
(23, 424, 13, 'IP', 'IN_PROGRESS', 0), -- EGR 4402 Capstone
(23, 130, 13, 'IP', 'IN_PROGRESS', 0), -- Civic Engagement
(23, 120, 13, 'IP', 'IN_PROGRESS', 0), -- Social Science

-- ==========================================================
-- YOUSSEF (CS Freshman - enrolled Fall 2025, first semester)
-- ==========================================================

-- Year 1 Fall (Fall 2025 - semester_id = 13) - CURRENT SEMESTER
(24, 1, 13, 'IP', 'IN_PROGRESS', 0),   -- FYE 1101 First Year Experience
(24, 3, 13, 'IP', 'IN_PROGRESS', 0),   -- FAS 0210 Strategic Academic Skills
(24, 50, 13, 'IP', 'IN_PROGRESS', 0),  -- ENG 1301 English Composition
(24, 92, 13, 'IP', 'IN_PROGRESS', 0),  -- MTH 1303 Calculus I
(24, 93, 13, 'IP', 'IN_PROGRESS', 0),  -- MTH 1304 Discrete Math
(24, 41, 13, 'IP', 'IN_PROGRESS', 0),  -- CSC 1401 Computer Programming
(24, 10, 13, 'IP', 'IN_PROGRESS', 0);  -- ARB 1241 Arabic

-- ==========================================================
