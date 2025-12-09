-- 8. RECOMMENDED SEQUENCES (Default Roadmaps)
-- ==========================================================

-- ============ BBA DEFAULT ROADMAP ============
INSERT INTO recommended_sequence (program_id, course_id, semester_number, recommended_order) VALUES
-- Semester 1 (Freshman Fall)
(1, 1, 1, 1),   -- FYE 1101
(1, 3, 1, 2),   -- FAS 0210
(1, 50, 1, 3),  -- ENG 1301
(1, 91, 1, 4),  -- MTH 1305
(1, 10, 1, 5),  -- Arabic

-- Semester 2 (Freshman Spring)
(1, 2, 2, 1),   -- FYE 1102
(1, 4, 2, 2),   -- FAS 1220
(1, 30, 2, 3),  -- COM 1301
(1, 200, 2, 4), -- ACC 2301
(1, 120, 2, 5), -- Social Science

-- Semester 3 (Sophomore Fall)
(1, 52, 3, 1),  -- ENG 2302
(1, 201, 3, 2), -- ACC 2302
(1, 210, 3, 3), -- ECO 2301
(1, 240, 3, 4), -- GBU 2301
(1, 40, 3, 5),  -- CSC 1300

-- Semester 4 (Sophomore Spring)
(1, 211, 4, 1), -- ECO 2302
(1, 243, 4, 2), -- GBU 3311
(1, 60, 4, 3),  -- History
(1, 70, 4, 4),  -- Humanities
(1, 110, 4, 5), -- Physical Science

-- Semester 5 (Junior Fall)
(1, 220, 5, 1), -- FIN 3301
(1, 250, 5, 2), -- MGT 3301
(1, 270, 5, 3), -- MKT 3301
(1, 241, 5, 4), -- GBU 3302
(1, 202, 5, 5), -- ACC 3201

-- Semester 6 (Junior Spring)
(1, 251, 6, 1), -- MGT 3302
(1, 290, 6, 2), -- MIS 3301
(1, 242, 6, 3), -- GBU 3203
(1, 20, 6, 4),  -- FRN 3210
(1, 80, 6, 5),  -- Arts

-- Semester 7 (Senior Fall) - Summer Internship assumed
(1, 300, 7, 1), -- INT 4301 (after summer internship)
(1, 256, 7, 2), -- MGT 4303
(1, 130, 7, 3), -- Civic Engagement
-- Concentration courses (3 courses)

-- Semester 8 (Senior Spring)
(1, 255, 8, 1), -- MGT 4301 (Capstone)
(1, 245, 8, 2); -- GBU 4100

-- BBA Minor slots (group_id 302 = BBA Minor, 15 credits over semesters 4-8)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(1, 302, 4, 10),  -- Minor Course 1 in Semester 4
(1, 302, 5, 10),  -- Minor Course 2 in Semester 5
(1, 302, 6, 10),  -- Minor Course 3 in Semester 6
(1, 302, 7, 10),  -- Minor Course 4 in Semester 7
(1, 302, 8, 10);  -- Minor Course 5 in Semester 8

-- BBA Concentration slots (group_id 301 = BBA Concentration, 15 credits / 5 courses over semesters 6-8)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(1, 301, 6, 11),  -- Concentration Course 1 in Semester 6
(1, 301, 7, 11),  -- Concentration Course 2 in Semester 7
(1, 301, 7, 12),  -- Concentration Course 3 in Semester 7
(1, 301, 8, 11),  -- Concentration Course 4 in Semester 8
(1, 301, 8, 12);  -- Concentration Course 5 in Semester 8

-- BBA Elective slots (group_id 303 = BBA Electives, 9 credits / 3 courses in semesters 7-8)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(1, 303, 7, 13),  -- Elective 1 in Semester 7
(1, 303, 8, 13),  -- Elective 2 in Semester 8
(1, 303, 8, 14);  -- Elective 3 in Semester 8

-- ============ BSCSC DEFAULT ROADMAP ============
INSERT INTO recommended_sequence (program_id, course_id, semester_number, recommended_order) VALUES
-- Semester 1 (Freshman Fall) - 16 SCH
(3, 92, 1, 1),  -- MTH 1303 Calculus I
(3, 93, 1, 2),  -- MTH 1304 Discrete Math
(3, 41, 1, 3),  -- CSC 1401
(3, 10, 1, 4),  -- Arabic
(3, 50, 1, 5),  -- ENG 1301
(3, 3, 1, 6),   -- FAS 0210
(3, 1, 1, 7),   -- FYE 1101

-- Semester 2 (Freshman Spring) - 16 SCH
(3, 96, 2, 1),  -- MTH 2301 Calculus II
(3, 116, 2, 2), -- PHY 1401
(3, 400, 2, 3), -- CSC 2302 Data Structures
(3, 30, 2, 4),  -- COM 1301
(3, 4, 2, 5),   -- FAS 1220
(3, 2, 2, 6),   -- FYE 1102

-- Semester 3 (Sophomore Fall) - 16 SCH
(3, 99, 3, 1),  -- MTH 2320 Linear Algebra
(3, 117, 3, 2), -- PHY 1402
(3, 404, 3, 3), -- CSC 2306 OOP
(3, 53, 3, 4),  -- ENG 2303 Technical Writing
-- Minor Course 1

-- Semester 4 (Sophomore Spring) - 16 SCH
(3, 100, 4, 1), -- MTH 3301 Prob & Stats
(3, 111, 4, 2), -- Basic Science Elective
(3, 403, 4, 3), -- CSC 2305 Computer Architecture
(3, 70, 4, 4),  -- Humanities
-- Minor Course 2

-- Semester 5 (Junior Fall) - 17 SCH
(3, 420, 5, 1), -- EGR 2302 Engineering Economics
(3, 405, 5, 2), -- CSC 3315 Languages & Compilers
(3, 406, 5, 3), -- CSC 3323 Analysis of Algorithms
(3, 407, 5, 4), -- CSC 3324 Software Engineering
(3, 20, 5, 5),  -- FRN 3210
-- Minor Course 3

-- Semester 6 (Junior Spring) - 18 SCH
(3, 408, 6, 1), -- CSC 3326 Database Systems
(3, 409, 6, 2), -- CSC 3351 Operating Systems
(3, 410, 6, 3), -- CSC 3371 Networks
(3, 80, 6, 4),  -- Arts
-- Minor Course 4
-- Free Elective 1

-- Semester 7 (Senior Fall) - 17 SCH
(3, 411, 7, 1), -- CSC 3374 Distributed Programming
(3, 412, 7, 2), -- CSC 4301 AI
(3, 413, 7, 3), -- CSC 4307 Agile/DevOps
(3, 60, 7, 4),  -- History/PolSci
-- Computing Elective
-- Minor Course 5

-- Semester 8 (Senior Spring) - 20 SCH
(3, 414, 8, 1), -- CSC 4308 Cybersecurity
(3, 423, 8, 2), -- EGR 4300 Internship
(3, 424, 8, 3), -- EGR 4402 Capstone
(3, 130, 8, 4), -- Civic Engagement
(3, 120, 8, 5); -- Social Science

-- BSCSC Minor Course slots (group_id 403 = BSCSC Minor, 15 credits / 5 courses over semesters 3-7)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(3, 403, 3, 10),  -- Minor Course 1 in Semester 3 (Sophomore Fall)
(3, 403, 4, 10),  -- Minor Course 2 in Semester 4 (Sophomore Spring)
(3, 403, 5, 10),  -- Minor Course 3 in Semester 5 (Junior Fall)
(3, 403, 6, 10),  -- Minor Course 4 in Semester 6 (Junior Spring)
(3, 403, 7, 10);  -- Minor Course 5 in Semester 7 (Senior Fall)

-- BSCSC Free Elective slots (group_id 404 = BSCSC Free Electives, 6 credits / 2 courses)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(3, 404, 6, 11),  -- Free Elective 1 in Semester 6 (Junior Spring)
(3, 404, 8, 10);  -- Free Elective 2 in Semester 8 (Senior Spring)

-- ============ BACS DEFAULT ROADMAP ============
INSERT INTO recommended_sequence (program_id, course_id, semester_number, recommended_order) VALUES
-- Semester 1 (Freshman Fall)
(2, 1, 1, 1),   -- FYE 1101
(2, 3, 1, 2),   -- FAS 0210
(2, 50, 1, 3),  -- ENG 1301
(2, 90, 1, 4),  -- MTH 1388
(2, 10, 1, 5),  -- Arabic
(2, 123, 1, 6), -- PSY 1301

-- Semester 2 (Freshman Spring)
(2, 2, 2, 1),   -- FYE 1102
(2, 4, 2, 2),   -- FAS 1220
(2, 30, 2, 3),  -- COM 1301
(2, 124, 2, 4), -- ECO 1300
(2, 110, 2, 5), -- Physical Science

-- Semester 3 (Sophomore Fall)
(2, 51, 3, 1),  -- ENG 2301
(2, 510, 3, 2), -- COM 1304
(2, 500, 3, 3), -- SSC 2401
(2, 503, 3, 4), -- COM 2301
(2, 60, 3, 5),  -- History

-- Semester 4 (Sophomore Spring)
(2, 511, 4, 1), -- COM 2403
(2, 501, 4, 2), -- SSC 3303
(2, 70, 4, 3),  -- Humanities
(2, 40, 4, 4),  -- CSC 1300
-- Minor Course 1

-- Semester 5 (Junior Fall)
(2, 512, 5, 1), -- COM 2427
(2, 514, 5, 2), -- COM 3320
(2, 513, 5, 3), -- COM 3303
(2, 20, 5, 4),  -- FRN 3210
-- Concentration Required 1
-- Minor Course 2

-- Semester 6 (Junior Spring)
(2, 515, 6, 1), -- COM 3321
(2, 80, 6, 2);  -- Arts

-- Semester 7 (Senior Fall) - Summer Internship
INSERT INTO recommended_sequence (program_id, course_id, semester_number, recommended_order) VALUES
(2, 301, 7, 1); -- INT 4302

-- Semester 8 (Senior Spring)
INSERT INTO recommended_sequence (program_id, course_id, semester_number, recommended_order) VALUES
(2, 502, 8, 1), -- SSC 4302 Capstone
(2, 130, 8, 2); -- Civic Engagement

-- BACS Minor slots (group_id 353 = BACS Minor, 15 credits / 5 courses over semesters 4-8)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(2, 353, 4, 10),  -- Minor Course 1 in Semester 4
(2, 353, 5, 10),  -- Minor Course 2 in Semester 5
(2, 353, 6, 10),  -- Minor Course 3 in Semester 6
(2, 353, 7, 10),  -- Minor Course 4 in Semester 7
(2, 353, 8, 10);  -- Minor Course 5 in Semester 8

-- BACS Concentration slots (group_id 352 = BACS Concentration, 21 credits over semesters 5-8)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(2, 352, 5, 11),  -- Concentration 1 in Semester 5
(2, 352, 6, 11),  -- Concentration 2 in Semester 6
(2, 352, 6, 12),  -- Concentration 3 in Semester 6
(2, 352, 7, 11),  -- Concentration 4 in Semester 7
(2, 352, 7, 12),  -- Concentration 5 in Semester 7
(2, 352, 8, 11);  -- Concentration 6 in Semester 8

-- BACS Elective slots (group_id 354 = BACS Electives, 9 credits / 3 courses in semester 8)
INSERT INTO recommended_sequence (program_id, requirement_group_id, semester_number, recommended_order) VALUES
(2, 354, 8, 13),  -- Elective 1 in Semester 8
(2, 354, 8, 14),  -- Elective 2 in Semester 8
(2, 354, 8, 15);  -- Elective 3 in Semester 8

-- ==========================================================
