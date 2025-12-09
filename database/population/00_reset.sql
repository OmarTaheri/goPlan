-- ==========================================================
-- COMPREHENSIVE DATABASE POPULATION FOR DEGREE PLANNER
-- Based on: BACS, BSCSC, BBA Program Sheets (Catalog 2019-2021)
-- Al Akhawayn University
-- ==========================================================

-- ==========================================================
-- 0. RESET DATABASE (Start Fresh)
-- ==========================================================
use goplan;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE semester_approvals;
TRUNCATE TABLE student_plan;
TRUNCATE TABLE student_plan_drafts;
TRUNCATE TABLE student_transcript;
TRUNCATE TABLE student_programs;
TRUNCATE TABLE student_profiles;
TRUNCATE TABLE recommended_sequence;
TRUNCATE TABLE requirement_group_courses;
TRUNCATE TABLE program_requirement_groups;
TRUNCATE TABLE programs;
TRUNCATE TABLE course_dependencies;
TRUNCATE TABLE courses;
TRUNCATE TABLE users;
TRUNCATE TABLE semesters;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
