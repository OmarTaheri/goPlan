-- 2. USERS (Admin, advisor, students)
-- ==========================================================
-- All users have password: "Password123!" for testing
-- Bcrypt hash with 10 rounds (OWASP recommended)
INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, role) VALUES
-- Administrator
(1, 'admin', 'admin@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'System', 'Admin', 'ADMIN'),

-- Advisor
(4, 'advisor_sse', 'advisor.sse@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'Nasser', 'Assem', 'ADVISOR'),

-- Students
(23, 'cs_senior_omar', 'omar.cs@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'Omar', 'Taheri', 'STUDENT'),
(24, 'cs_freshman_ismail', 'ismail.cs@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'Ismail', 'Tanji', 'STUDENT');

-- ==========================================================
