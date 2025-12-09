-- 13. SEMESTER APPROVALS (Amina only)
-- ==========================================================
INSERT INTO semester_approvals (student_id, semester_id, advisor_id, approval_status, advisor_comments, approved_at) VALUES
-- Historical approvals from Amina's advisor (user_id = 4)
(23, 1, 4, 'APPROVED', 'Great start to the CS program. Excellent course selection.', '2021-08-25'),
(23, 2, 4, 'APPROVED', 'Good progress on prerequisites.', '2022-01-10'),
(23, 4, 4, 'APPROVED', 'Nice mix of core CS and math courses.', '2022-08-20'),
(23, 5, 4, 'APPROVED', 'On track for junior year. Consider research opportunities.', '2023-01-08'),
(23, 7, 4, 'APPROVED', 'Solid junior year performance. Ready for senior courses.', '2023-08-18'),
(23, 8, 4, 'APPROVED', 'Excellent progress on senior requirements.', '2024-01-12'),
(23, 9, 4, 'APPROVED', 'Internship approved. Great experience opportunity.', '2024-05-20'),

-- Current semester awaiting advisor review
(23, 10, 4, 'PENDING', NULL, NULL);

-- ==========================================================
-- END OF COMPREHENSIVE POPULATION
-- ==========================================================

-- Summary Statistics (Amina-focused dataset):
-- Students: 1 student (Amina Berrada)
-- Advisors: 1 advisor (Fatima Alaoui)
-- Other domain data (programs, courses, groups) remain comprehensive
