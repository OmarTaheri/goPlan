-- 1. SEMESTERS (Extended for 4-year planning)
-- Current date: December 2025, so Fall 2025 is current semester
-- ==========================================================
INSERT INTO semesters (semester_id, name, term, year, start_date, end_date, is_active) VALUES
-- Historical semesters
(1, 'Fall 2021', 'FALL', 2021, '2021-09-01', '2021-12-15', FALSE),
(2, 'Spring 2022', 'SPRING', 2022, '2022-01-15', '2022-05-15', FALSE),
(3, 'Summer 2022', 'SUMMER', 2022, '2022-06-01', '2022-08-15', FALSE),
(4, 'Fall 2022', 'FALL', 2022, '2022-09-01', '2022-12-15', FALSE),
(5, 'Spring 2023', 'SPRING', 2023, '2023-01-15', '2023-05-15', FALSE),
(6, 'Summer 2023', 'SUMMER', 2023, '2023-06-01', '2023-08-15', FALSE),
(7, 'Fall 2023', 'FALL', 2023, '2023-09-01', '2023-12-15', FALSE),
(8, 'Spring 2024', 'SPRING', 2024, '2024-01-15', '2024-05-15', FALSE),
(9, 'Summer 2024', 'SUMMER', 2024, '2024-06-01', '2024-08-15', FALSE),
(10, 'Fall 2024', 'FALL', 2024, '2024-09-01', '2024-12-15', FALSE),
(11, 'Spring 2025', 'SPRING', 2025, '2025-01-15', '2025-05-15', FALSE),
(12, 'Summer 2025', 'SUMMER', 2025, '2025-06-01', '2025-08-15', FALSE),
-- Current semester (students can see but not submit for this one yet)
(13, 'Fall 2025', 'FALL', 2025, '2025-09-01', '2025-12-15', FALSE),
-- Next semester (students can submit to advisors for this one)
(14, 'Spring 2026', 'SPRING', 2026, '2026-01-15', '2026-05-15', TRUE),
(15, 'Summer 2026', 'SUMMER', 2026, '2026-06-01', '2026-08-15', FALSE),
(16, 'Fall 2026', 'FALL', 2026, '2026-09-01', '2026-12-15', FALSE),
(17, 'Spring 2027', 'SPRING', 2027, '2027-01-15', '2027-05-15', FALSE),
(18, 'Summer 2027', 'SUMMER', 2027, '2027-06-01', '2027-08-15', FALSE),
(19, 'Fall 2027', 'FALL', 2027, '2027-09-01', '2027-12-15', FALSE),
(20, 'Spring 2028', 'SPRING', 2028, '2028-01-15', '2028-05-15', FALSE),
(21, 'Summer 2028', 'SUMMER', 2028, '2028-06-01', '2028-08-15', FALSE),
(22, 'Fall 2028', 'FALL', 2028, '2028-09-01', '2028-12-15', FALSE),
(23, 'Spring 2029', 'SPRING', 2029, '2029-01-15', '2029-05-15', FALSE);

-- ==========================================================
