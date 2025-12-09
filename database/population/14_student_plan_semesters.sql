-- 14. STUDENT PLAN SEMESTERS
-- ==========================================================
-- Timeline: Fall 2025 is current, Spring 2026 is next plannable semester
-- These are the planning semesters that students can add courses to

DELETE FROM student_plan_semesters WHERE draft_id = 1;
DELETE FROM student_plan_semesters WHERE draft_id = 2;

INSERT INTO student_plan_semesters (draft_id, semester_number, term, year, is_locked) VALUES
-- Amina's planning semester (only needs Spring 2026 to graduate)
(1, 1, 'SPRING', 2026, FALSE),

-- Youssef's planning semesters (7 more semesters to complete degree)
(2, 1, 'SPRING', 2026, FALSE),
(2, 2, 'FALL', 2026, FALSE),
(2, 3, 'SPRING', 2027, FALSE),
(2, 4, 'FALL', 2027, FALSE),
(2, 5, 'SPRING', 2028, FALSE),
(2, 6, 'FALL', 2028, FALSE),
(2, 7, 'SPRING', 2029, FALSE);

-- ==========================================================
