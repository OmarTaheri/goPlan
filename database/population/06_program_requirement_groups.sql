-- 6. PROGRAM REQUIREMENT GROUPS
-- ==========================================================

-- ============ GENERAL EDUCATION (Shared across programs) ============

-- GenEd for BBA (40 SCH)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(100, 1, 'BBA General Education', 40, 0, NULL),
(101, 1, 'First Year Experience', 2, 2, 100),
(102, 1, 'Foundations for Academic Success', 2, 2, 100),
(103, 1, 'Arabic', 2, 1, 100),
(104, 1, 'French', 2, 1, 100),
(105, 1, 'Communication', 3, 1, 100),
(106, 1, 'Computer Science', 3, 1, 100),
(107, 1, 'English', 6, 2, 100),
(108, 1, 'History or Political Science', 3, 1, 100),
(109, 1, 'Humanities', 3, 1, 100),
(110, 1, 'Art Appreciation & Creation', 3, 1, 100),
(111, 1, 'Mathematics', 3, 1, 100),
(112, 1, 'Physical Sciences', 4, 1, 100),
(113, 1, 'Social Sciences', 3, 1, 100),
(114, 1, 'Civic Engagement', 1, 1, 100);

-- GenEd for BACS (40 SCH)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(150, 2, 'BACS General Education', 40, 0, NULL),
(151, 2, 'First Year Experience', 2, 2, 150),
(152, 2, 'Foundations for Academic Success', 2, 2, 150),
(153, 2, 'Arabic', 2, 1, 150),
(154, 2, 'French', 2, 1, 150),
(155, 2, 'Communication', 3, 1, 150),
(156, 2, 'Computer Science', 3, 1, 150),
(157, 2, 'English', 6, 2, 150),
(158, 2, 'History or Political Science', 3, 1, 150),
(159, 2, 'Humanities', 3, 1, 150),
(160, 2, 'Art Appreciation & Creation', 3, 1, 150),
(161, 2, 'Mathematics', 3, 1, 150),
(162, 2, 'Physical Sciences', 4, 1, 150),
(163, 2, 'Social Sciences', 3, 1, 150),
(164, 2, 'Civic Engagement', 1, 1, 150);

-- GenEd for BSCSC (30 SCH - different structure)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(200, 3, 'BSCSC General Education', 30, 0, NULL),
(201, 3, 'First Year Experience', 2, 2, 200),
(202, 3, 'Foundations for Academic Success', 2, 2, 200),
(203, 3, 'Arabic', 2, 1, 200),
(204, 3, 'French', 2, 1, 200),
(205, 3, 'Communication', 3, 1, 200),
(206, 3, 'English', 6, 2, 200),
(207, 3, 'History or Political Science', 3, 1, 200),
(208, 3, 'Humanities', 3, 1, 200),
(209, 3, 'Art Appreciation & Creation', 3, 1, 200),
(210, 3, 'Social Sciences', 3, 1, 200),
(211, 3, 'Civic Engagement', 1, 1, 200);

-- ============ BBA MAJOR REQUIREMENTS ============

INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(300, 1, 'BBA Business Major Common Core', 50, 18, NULL),
(301, 1, 'BBA Concentration', 15, 5, NULL),
(302, 1, 'BBA Minor', 15, 0, NULL),
(303, 1, 'BBA Electives', 9, 3, NULL);

-- ============ BACS MAJOR REQUIREMENTS ============

INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(350, 2, 'BACS School Core Curriculum', 19, 6, NULL),
(351, 2, 'BACS Communication Studies Major Core', 20, 6, NULL),
(352, 2, 'BACS Concentration', 21, 0, NULL),  -- 21-25 based on concentration
(353, 2, 'BACS Minor', 15, 0, NULL),
(354, 2, 'BACS Electives', 9, 3, NULL);

-- ============ BSCSC MAJOR REQUIREMENTS ============

INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(400, 3, 'BSCSC Mathematics Requirements', 15, 5, NULL),
(401, 3, 'BSCSC Sciences and Engineering Requirements', 15, 4, NULL),
(402, 3, 'BSCSC Computing Core & Major Requirements', 55, 15, NULL),
(403, 3, 'BSCSC Minor', 15, 5, NULL),
(404, 3, 'BSCSC Free Electives', 6, 2, NULL);

-- ============ BBA CONCENTRATION REQUIREMENTS ============

-- Finance Concentration (ID 10)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(500, 10, 'Finance Concentration Courses', 15, 5, NULL);

-- Management Concentration (ID 11)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(510, 11, 'Management Concentration Courses', 15, 5, NULL);

-- Marketing Concentration (ID 12)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(520, 12, 'Marketing Concentration Courses', 15, 5, NULL);

-- International Business Concentration (ID 13)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(530, 13, 'International Business Concentration Courses', 15, 5, NULL);

-- Logistics & SCM Concentration (ID 14)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(540, 14, 'Logistics SCM Required', 3, 1, NULL),
(541, 14, 'Logistics SCM Electives', 12, 4, NULL);

-- ============ BACS CONCENTRATION REQUIREMENTS ============

-- Media Production Concentration (ID 20)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(600, 20, 'Media Production Required Courses', 12, 3, NULL),
(601, 20, 'Media Production Optional Courses', 9, 3, NULL);

-- Strategic Communication Concentration (ID 21)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(610, 21, 'Strategic Communication Required Courses', 9, 3, NULL),
(611, 21, 'Strategic Communication Optional Courses', 12, 4, NULL);

-- ============ MINOR REQUIREMENTS ============

-- Leadership Minor (ID 30)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(700, 30, 'Leadership Required Courses', 13, 5, NULL),
(701, 30, 'Leadership Elective', 3, 1, NULL);

-- Computer Science Minor (ID 31)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(710, 31, 'CS Minor Required Courses', 6, 2, NULL),
(711, 31, 'CS Minor Electives', 9, 3, NULL);

-- Mathematics Minor (ID 32)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(720, 32, 'Math Minor Required Courses', 6, 2, NULL),
(721, 32, 'Math Minor Electives', 9, 3, NULL);

-- International Studies Minor (ID 33)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(730, 33, 'IS Minor Required Courses', 6, 2, NULL),
(731, 33, 'IS Minor Electives', 6, 2, NULL),
(732, 33, 'IS Minor Optional', 3, 1, NULL);

-- HRD Minor (ID 34)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(740, 34, 'HRD Minor Required Courses', 10, 3, NULL),
(741, 34, 'HRD Minor Electives', 6, 2, NULL);

-- Psychology Minor (ID 39)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(750, 39, 'Psychology Minor Required Courses', 6, 2, NULL),
(751, 39, 'Psychology Minor Electives', 9, 3, NULL);

-- Gender Studies Minor (ID 37)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(760, 37, 'Gender Studies Required Courses', 12, 4, NULL),
(761, 37, 'Gender Studies Optional', 3, 1, NULL);

-- African Studies Minor (ID 38)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(770, 38, 'African Studies Required Courses', 9, 3, NULL),
(771, 38, 'African Studies Electives', 6, 2, NULL);

-- English Minor (ID 40)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(780, 40, 'English Minor Writing Courses', 6, 2, NULL),
(781, 40, 'English Minor Literature Courses', 9, 3, NULL);

-- Business Administration Minor (ID 41)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(790, 41, 'BA Minor Required Courses', 9, 3, NULL),
(791, 41, 'BA Minor Electives', 6, 2, NULL);

-- Communication Studies Minor (ID 36)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(800, 36, 'COM Minor Required Courses', 9, 3, NULL),
(801, 36, 'COM Minor Electives', 6, 2, NULL);

-- Organizational Studies Minor (ID 35)
INSERT INTO program_requirement_groups (group_id, program_id, name, credits_required, min_courses_required, parent_group_id) VALUES
(810, 35, 'Org Studies Required Courses', 9, 3, NULL),
(811, 35, 'Org Studies Electives', 6, 2, NULL);

-- ==========================================================
