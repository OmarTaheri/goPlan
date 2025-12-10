-- 13. SEMESTER APPROVALS
-- ==========================================================
-- Timeline: Fall 2025 is current semester (semester_id = 13)
-- Omar's historical approvals starting from Fall 2022

INSERT INTO semester_approvals (student_id, semester_id, advisor_id, approval_status, advisor_comments, approved_at) VALUES
-- Omar's historical approvals from advisor (user_id = 4)
(23, 4, 4, 'APPROVED', 'Great start to the CS program. Excellent course selection.', '2022-08-25'),   -- Fall 2022
(23, 5, 4, 'APPROVED', 'Good progress on prerequisites.', '2023-01-10'),                              -- Spring 2023
(23, 7, 4, 'APPROVED', 'Nice mix of core CS and math courses.', '2023-08-20'),                        -- Fall 2023
(23, 8, 4, 'APPROVED', 'On track for junior year. Consider research opportunities.', '2024-01-08'),  -- Spring 2024
(23, 10, 4, 'APPROVED', 'Solid junior year performance. Ready for senior courses.', '2024-08-18'),   -- Fall 2024
(23, 11, 4, 'APPROVED', 'Excellent progress on senior requirements.', '2025-01-12'),                  -- Spring 2025
(23, 12, 4, 'APPROVED', 'Internship approved. Great experience opportunity.', '2025-05-20'),         -- Summer 2025

-- Current semester awaiting completion (no approval needed yet)
(23, 13, 4, 'PENDING', NULL, NULL);  -- Fall 2025 (current)

-- Ismail has no approvals yet (first semester, just started)

-- ==========================================================
-- END OF COMPREHENSIVE POPULATION
-- ==========================================================

-- Summary Statistics:
-- Current Semester: Fall 2025 (semester_id = 13)
-- Next Planning Semester: Spring 2026 (semester_id = 14)
-- Students: 2 (Omar - Senior, Ismail - Freshman)
-- Advisors: 1 (Nasser Assem)

