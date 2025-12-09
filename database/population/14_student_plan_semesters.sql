-- 14. STUDENT PLAN SEMESTERS


-- The user added only the last plan semster in the planner
DELETE FROM student_plan_semesters WHERE draft_id = 1;
DELETE FROM student_plan_semesters WHERE draft_id = 2;

INSERT INTO student_plan_semesters (draft_id, semester_number, term, year, is_locked) VALUES
(1, 1, 'SPRING', 2025, FALSE),
-- Youssef's planning semesters (starting Spring 2025)
(2, 1, 'SPRING', 2025, FALSE);
