-- 7. REQUIREMENT GROUP COURSES (Linking courses to requirements)
-- ==========================================================

-- ============ BBA GENED COURSE LINKS ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
-- First Year Experience
(101, 1, TRUE), -- FYE 1101
(101, 2, TRUE), -- FYE 1102
-- Foundations
(102, 3, TRUE), -- FAS 0210
(102, 4, TRUE), -- FAS 1220
-- Arabic (one required)
(103, 10, FALSE), (103, 11, FALSE), (103, 12, FALSE), (103, 13, FALSE),
(103, 14, FALSE), (103, 15, FALSE), (103, 16, FALSE), (103, 17, FALSE),
-- French
(104, 20, TRUE), -- FRN 3210
-- Communication
(105, 30, TRUE), -- COM 1301
-- Computer Science (choose one)
(106, 40, FALSE), (106, 41, FALSE),
-- English (both required for BBA)
(107, 50, TRUE), -- ENG 1301
(107, 52, TRUE), -- ENG 2302
-- History/PolSci (choose one)
(108, 60, FALSE), (108, 61, FALSE), (108, 65, FALSE), (108, 66, FALSE), (108, 67, FALSE),
-- Humanities (choose one)
(109, 70, FALSE), (109, 71, FALSE), (109, 72, FALSE), (109, 73, FALSE),
-- Arts (choose one)
(110, 80, FALSE), (110, 81, FALSE), (110, 82, FALSE), (110, 83, FALSE), 
(110, 84, FALSE), (110, 85, FALSE), (110, 86, FALSE), (110, 87, FALSE), (110, 88, FALSE), (110, 57, FALSE),
-- Mathematics
(111, 91, TRUE), -- MTH 1305
-- Physical Sciences (choose one)
(112, 110, FALSE), (112, 111, FALSE), (112, 113, FALSE), (112, 115, FALSE),
-- Social Sciences (choose one)
(113, 120, FALSE), (113, 121, FALSE), (113, 122, FALSE), (113, 123, FALSE),
-- Civic Engagement
(114, 130, TRUE); -- SLP 1101

-- ============ BBA MAJOR CORE COURSE LINKS ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(300, 200, TRUE), -- ACC 2301
(300, 201, TRUE), -- ACC 2302
(300, 202, TRUE), -- ACC 3201
(300, 210, TRUE), -- ECO 2301
(300, 211, TRUE), -- ECO 2302
(300, 220, TRUE), -- FIN 3301
(300, 240, TRUE), -- GBU 2301
(300, 241, TRUE), -- GBU 3302
(300, 242, TRUE), -- GBU 3203
(300, 243, TRUE), -- GBU 3311
(300, 245, TRUE), -- GBU 4100
(300, 250, TRUE), -- MGT 3301
(300, 251, TRUE), -- MGT 3302
(300, 256, TRUE), -- MGT 4303
(300, 255, TRUE), -- MGT 4301 (Capstone)
(300, 270, TRUE), -- MKT 3301
(300, 290, TRUE), -- MIS 3301
(300, 300, TRUE); -- INT 4301

-- ============ BBA CONCENTRATION COURSE LINKS ============

-- Finance Concentration
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(500, 221, FALSE), (500, 222, FALSE), (500, 223, FALSE), (500, 224, FALSE),
(500, 225, FALSE), (500, 226, FALSE), (500, 227, FALSE), (500, 228, FALSE),
(500, 229, FALSE), (500, 230, FALSE);

-- Management Concentration
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(510, 607, FALSE), -- HRD 3401
(510, 609, FALSE), -- HRD 4303
(510, 252, FALSE), -- MGT 3305
(510, 253, FALSE), -- MGT 3306
(510, 254, FALSE), -- MGT 3399
(510, 257, FALSE), -- MGT 4305
(510, 258, FALSE), -- MGT 4306
(510, 259, FALSE), -- MGT 4307
(510, 260, FALSE), -- MGT 4308
(510, 261, FALSE), -- MGT 4310
(510, 262, FALSE), -- MGT 4311
(510, 263, FALSE), -- MGT 4312
(510, 264, FALSE), -- MGT 4314
(510, 280, FALSE); -- MKT 4307

-- Marketing Concentration
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(520, 271, FALSE), -- MKT 3302
(520, 272, FALSE), -- MKT 3303
(520, 273, FALSE), -- MKT 3304
(520, 274, FALSE), -- MKT 3305
(520, 275, FALSE), -- MKT 3399
(520, 276, FALSE), -- MKT 4302
(520, 277, FALSE), -- MKT 4304
(520, 278, FALSE), -- MKT 4305
(520, 279, FALSE), -- MKT 4306
(520, 280, FALSE), -- MKT 4307
(520, 281, FALSE); -- MKT 4311

-- International Business Concentration
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(530, 203, FALSE), -- ACC 4305
(530, 213, FALSE), -- ECO 3301
(530, 226, FALSE), -- FIN 4304
(530, 244, FALSE), -- GBU 3399
(530, 246, FALSE), -- GBU 4308
(530, 258, FALSE), -- MGT 4306
(530, 264, FALSE), -- MGT 4314
(530, 279, FALSE), -- MKT 4306
(530, 291, FALSE); -- MIS 3302

-- Logistics/SCM Concentration
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(540, 295, TRUE),  -- SCM 3301 (Required)
(541, 213, FALSE), -- ECO 3301
(541, 262, FALSE), -- MGT 4311
(541, 263, FALSE), -- MGT 4312
(541, 296, FALSE), -- SCM 3399
(541, 297, FALSE), -- SCM 4301
(541, 298, FALSE), -- SCM 4302
(541, 299, FALSE); -- SCM 4303

-- ============ BACS GENED COURSE LINKS ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(151, 1, TRUE), (151, 2, TRUE),
(152, 3, TRUE), (152, 4, TRUE),
(153, 10, FALSE), (153, 11, FALSE), (153, 12, FALSE), (153, 13, FALSE),
(153, 14, FALSE), (153, 15, FALSE), (153, 16, FALSE), (153, 17, FALSE),
(154, 20, TRUE),
(155, 30, TRUE),
(156, 40, FALSE), (156, 41, FALSE),
(157, 50, TRUE), (157, 51, TRUE), -- ENG 1301 + ENG 2301 for BACS
(158, 60, FALSE), (158, 61, FALSE), (158, 65, FALSE), (158, 66, FALSE), (158, 67, FALSE),
(159, 70, FALSE), (159, 71, FALSE), (159, 72, FALSE), (159, 73, FALSE),
(160, 80, FALSE), (160, 81, FALSE), (160, 82, FALSE), (160, 83, FALSE),
(160, 84, FALSE), (160, 85, FALSE), (160, 86, FALSE), (160, 87, FALSE), (160, 57, FALSE),
(161, 90, FALSE), (161, 91, FALSE), -- MTH 1388 or MTH 1305
(162, 110, FALSE), (162, 113, FALSE), (162, 115, FALSE),
(163, 120, FALSE), (163, 121, FALSE), (163, 122, FALSE), (163, 123, FALSE),
(164, 130, TRUE);

-- ============ BACS SCHOOL CORE ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(350, 124, TRUE), -- ECO 1300
(350, 501, TRUE), -- SSC 3303
(350, 503, TRUE), -- COM 2301
(350, 500, TRUE), -- SSC 2401
(350, 502, TRUE), -- SSC 4302
(350, 301, TRUE); -- INT 4302

-- ============ BACS MAJOR CORE ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(351, 510, TRUE), -- COM 1304
(351, 511, TRUE), -- COM 2403
(351, 512, TRUE), -- COM 2427
(351, 513, TRUE), -- COM 3303
(351, 514, TRUE), -- COM 3320
(351, 515, TRUE); -- COM 3321

-- ============ BACS MEDIA PRODUCTION CONCENTRATION ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(600, 520, TRUE),  -- COM 2404 (Required)
(600, 521, TRUE),  -- COM 3402 (Required)
(600, 522, TRUE),  -- COM 4405 (Required)
-- Optional courses for Media Production (choose 3)
(601, 530, FALSE), (601, 540, FALSE), (601, 541, FALSE), (601, 531, FALSE),
(601, 542, FALSE), (601, 532, FALSE), (601, 543, FALSE), (601, 544, FALSE),
(601, 545, FALSE), (601, 546, FALSE);

-- ============ BACS STRATEGIC COMMUNICATION CONCENTRATION ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(610, 530, TRUE),  -- COM 3301 (Required)
(610, 531, TRUE),  -- COM 3311 (Required)
(610, 532, TRUE),  -- COM 3330 (Required)
-- Optional courses for Strategic Comm (choose 4)
(611, 520, FALSE), (611, 540, FALSE), (611, 541, FALSE), (611, 542, FALSE),
(611, 521, FALSE), (611, 543, FALSE), (611, 544, FALSE), (611, 545, FALSE),
(611, 546, FALSE), (611, 522, FALSE);

-- ============ BSCSC GENED COURSE LINKS ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(201, 1, TRUE), (201, 2, TRUE),
(202, 3, TRUE), (202, 4, TRUE),
(203, 10, FALSE), (203, 11, FALSE), (203, 12, FALSE), (203, 13, FALSE),
(203, 14, FALSE), (203, 15, FALSE), (203, 16, FALSE), (203, 17, FALSE),
(204, 20, TRUE),
(205, 30, TRUE),
(206, 50, TRUE), -- ENG 1301 English Composition
(206, 53, TRUE), -- ENG 2303 Technical Writing
(207, 60, FALSE), (207, 61, FALSE), (207, 65, FALSE), (207, 66, FALSE), (207, 67, FALSE),
(208, 74, FALSE), (208, 71, FALSE), (208, 72, FALSE), (208, 73, FALSE), (208, 70, FALSE),
(209, 80, FALSE), (209, 81, FALSE), (209, 82, FALSE), (209, 83, FALSE),
(209, 84, FALSE), (209, 85, FALSE), (209, 86, FALSE), (209, 87, FALSE), (209, 57, FALSE),
(210, 120, FALSE), (210, 121, FALSE), (210, 122, FALSE), (210, 123, FALSE), (210, 124, FALSE),
(211, 130, TRUE);

-- ============ BSCSC MATH REQUIREMENTS ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(400, 92, TRUE),  -- MTH 1303 Calculus I
(400, 93, TRUE),  -- MTH 1304 Discrete Math
(400, 96, TRUE),  -- MTH 2301 Calculus II
(400, 99, TRUE),  -- MTH 2320 Linear Algebra
(400, 100, TRUE); -- MTH 3301 Prob & Stats

-- ============ BSCSC SCIENCE/ENGINEERING REQUIREMENTS ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(401, 116, TRUE), -- PHY 1401
(401, 117, TRUE), -- PHY 1402
(401, 420, TRUE), -- EGR 2302
(401, 111, FALSE), (401, 112, FALSE), (401, 114, FALSE); -- Basic Science elective

-- ============ BSCSC COMPUTING CORE ============
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(402, 41, TRUE),  -- CSC 1401
(402, 400, TRUE), -- CSC 2302
(402, 403, TRUE), -- CSC 2305
(402, 404, TRUE), -- CSC 2306
(402, 405, TRUE), -- CSC 3315
(402, 406, TRUE), -- CSC 3323
(402, 407, TRUE), -- CSC 3324
(402, 408, TRUE), -- CSC 3326
(402, 409, TRUE), -- CSC 3351
(402, 410, TRUE), -- CSC 3371
(402, 411, TRUE), -- CSC 3374
(402, 412, TRUE), -- CSC 4301
(402, 413, TRUE), -- CSC 4307
(402, 414, TRUE), -- CSC 4308
(402, 423, TRUE), -- EGR 4300 Internship
(402, 424, TRUE), -- EGR 4402 Capstone
-- Computing Electives (5 additional credits to fulfill 55 credit requirement)
(402, 415, FALSE), -- CSC 3398 Special Topics (3cr)
(402, 421, FALSE), -- EGR 3331 Digital Logic Design (3cr)
(402, 401, FALSE), -- CSC 2303 Advanced Programming (3cr)
(402, 402, FALSE); -- CSC 2304 Computer Organization (3cr)

-- ============ MINOR COURSE LINKS ============

-- Leadership Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(700, 620, TRUE), -- LDR 1201
(700, 621, TRUE), -- LDR 1202
(700, 622, TRUE), -- LDR 2301
(700, 609, TRUE), -- HRD 4303
(700, 623, TRUE), -- LDR 4301
(701, 123, FALSE), (701, 120, FALSE), -- PSY 1301 or SOC 1301
(701, 547, FALSE), -- COM 3306
(701, 241, FALSE), -- GBU 3302
(701, 601, FALSE), (701, 602, FALSE), -- HRD 2301 or HRD 3302
(701, 612, FALSE), -- HRD 4306
(701, 252, FALSE), -- MGT 3305
(701, 253, FALSE), -- MGT 3306
(701, 260, FALSE), -- MGT 4308
(701, 263, FALSE), -- MGT 4312
(701, 264, FALSE), -- MGT 4314
(701, 69, FALSE),  -- PSC 3311
(701, 633, FALSE), -- PSY 2304
(701, 635, FALSE), -- PSY 3305
(701, 652, FALSE); -- SSC 3316

-- Computer Science Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(710, 400, TRUE), -- CSC 2302 (Required)
(710, 401, TRUE), -- CSC 2303 (Required)
(711, 407, FALSE), -- CSC 3324
(711, 408, FALSE), -- CSC 3326
(711, 402, FALSE), -- CSC 2304
(711, 415, FALSE); -- Any advanced CSC

-- Mathematics Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(720, 95, TRUE),  -- MTH 1312 (Required)
(720, 96, TRUE),  -- MTH 2301 (Required)
(721, 93, FALSE), -- MTH 1304
(721, 97, FALSE), -- MTH 2303
(721, 98, FALSE), -- MTH 2304
(721, 100, FALSE), -- MTH 3301
(721, 101, FALSE); -- MTH 3302

-- International Studies Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(730, 640, TRUE), -- INS 2301 (Required)
(730, 67, TRUE),  -- PSC 2301 (Required)
(731, 212, FALSE), -- ECO 2310
(731, 121, FALSE), -- GEO 1301
(731, 63, FALSE),  -- HIS 3301
(731, 641, FALSE); -- INS 3303

-- HRD Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(740, 600, TRUE), -- HRD 2300 (Required)
(740, 607, TRUE), -- HRD 3401 (Required)
(740, 602, TRUE), -- HRD 3302 (Required for BA students)
(741, 603, FALSE), -- HRD 3303
(741, 604, FALSE), -- HRD 3304
(741, 606, FALSE), -- HRD 3399
(741, 608, FALSE), -- HRD 4302
(741, 609, FALSE), -- HRD 4303
(741, 610, FALSE), -- HRD 4304
(741, 612, FALSE), -- HRD 4306
(741, 613, FALSE), -- HRD 4307
(741, 614, FALSE); -- HRD 4308

-- Psychology Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(750, 630, TRUE), -- PSY 1303 (Required)
(750, 631, TRUE), -- PSY 2302 (Required)
(751, 634, FALSE), -- PSY 3302
(751, 635, FALSE), -- PSY 3305
(751, 633, FALSE), -- PSY 2304
(751, 636, FALSE), -- PSY 3306
(751, 632, FALSE); -- PSY 2303

-- Gender Studies Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(760, 650, TRUE), -- SSC 2315 (Required)
(760, 651, TRUE), -- SSC 3311 (Required)
(760, 541, TRUE), -- COM 3315 (Required)
(760, 652, TRUE), -- SSC 3316 (Required)
(761, 636, FALSE), -- PSY 3306
(761, 653, FALSE); -- SSC 3398

-- African Studies Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(770, 76, TRUE),  -- HUM 2371 (Required)
(770, 68, TRUE),  -- PSC 2371 (Required)
(770, 62, TRUE),  -- HIS 2371 (Required)
(771, 64, FALSE), -- HIS 3311
(771, 671, FALSE), -- LIT 3371
(771, 642, FALSE), -- INS 3371
(771, 643, FALSE), -- INS 3372
(771, 644, FALSE), -- INS 3373
(771, 645, FALSE), -- INS 3374
(771, 660, FALSE), -- SSC 2371
(771, 661, FALSE), -- SSC 3371
(771, 662, FALSE), -- SSC 3372
(771, 663, FALSE); -- SSC 3379

-- English Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(780, 54, FALSE), -- ENG 2311
(780, 55, FALSE), -- ENG 2312
(780, 56, FALSE), -- ENG 2313
(780, 57, FALSE), -- ENG 2320
(781, 87, FALSE), -- LIT 3370
(781, 671, FALSE), -- LIT 3371
(781, 670, FALSE), -- LIT 3310
(781, 672, FALSE), -- LIT 3373
(781, 673, FALSE), -- LIT 3374
(781, 674, FALSE); -- LIT 3375

-- Business Administration Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(790, 210, TRUE), -- ECO 2301 (Required)
(790, 211, TRUE), -- ECO 2302 (Required)
(790, 200, TRUE), -- ACC 2301 (Required)
(791, 220, FALSE), -- FIN 3301
(791, 241, FALSE), -- GBU 3302
(791, 290, FALSE), -- MIS 3301
(791, 250, FALSE), -- MGT 3301
(791, 270, FALSE); -- MKT 3301

-- Communication Studies Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(800, 510, TRUE), -- COM 1304 (Required)
(800, 503, TRUE), -- COM 2301 (Required)
(800, 512, TRUE), -- COM 2427 (Required)
(801, 511, FALSE), -- COM 2403
(801, 520, FALSE), -- COM 2404
(801, 530, FALSE), -- COM 3301
(801, 540, FALSE), -- COM 3304
(801, 531, FALSE), -- COM 3311
(801, 541, FALSE), -- COM 3315
(801, 515, FALSE), -- COM 3321
(801, 542, FALSE), -- COM 3328
(801, 532, FALSE), -- COM 3330
(801, 521, FALSE), -- COM 3402
(801, 545, FALSE), -- COM 4401
(801, 546, FALSE), -- COM 4304
(801, 522, FALSE); -- COM 4405

-- Organizational Studies Minor
INSERT INTO requirement_group_courses (group_id, course_id, is_mandatory) VALUES
(810, 503, FALSE), -- COM 2301 or COM 1304
(810, 510, FALSE),
(810, 600, TRUE), -- HRD 2300 (Required)
(810, 634, TRUE), -- PSY 3302 (Required)
(811, 88, FALSE),  -- COM 2327
(811, 545, FALSE), -- COM 4401
(811, 531, FALSE), -- COM 3311
(811, 532, FALSE), -- COM 3330
(811, 607, FALSE), -- HRD 3401
(811, 603, FALSE), -- HRD 3303
(811, 604, FALSE), -- HRD 3304
(811, 605, FALSE), -- HRD 3305
(811, 606, FALSE), -- HRD 3399
(811, 608, FALSE), -- HRD 4302
(811, 609, FALSE), -- HRD 4303
(811, 610, FALSE), -- HRD 4304
(811, 611, FALSE), -- HRD 4305
(811, 612, FALSE), -- HRD 4306
(811, 613, FALSE); -- HRD 4307

-- ==========================================================
