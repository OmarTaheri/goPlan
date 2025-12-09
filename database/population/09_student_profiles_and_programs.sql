-- 9. STUDENT PROFILES & PROGRAMS (New Split Structure)
-- ==========================================================
-- Timeline: Fall 2025 is current semester

-- 1. Create Profiles (advisor and enrollment info only)
INSERT INTO student_profiles (user_id, advisor_id, enrollment_year) VALUES
(23, 4, 2022), -- Amina (Senior - enrolled Fall 2022, graduating Spring 2026)
(24, 4, 2025); -- Youssef (Freshman - enrolled Fall 2025)

-- 2. Assign Programs (Majors, Minors, Concentrations)
INSERT INTO student_programs (student_id, program_id, type) VALUES
-- Amina (CS + Math Minor)
(23, 3, 'MAJOR'), (23, 32, 'MINOR'),
-- Youssef (CS + Leadership Minor)
(24, 3, 'MAJOR'), (24, 30, 'MINOR');

-- ==========================================================
