-- 2. USERS (Admins, single advisor, Amina)
-- ==========================================================
-- All users have password: "Password123!" for testing
-- Bcrypt hash with 10 rounds (OWASP recommended)
INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, role) VALUES
-- Administrators
(1, 'admin', 'admin@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'System', 'Admin', 'ADMIN'),
(2, 'registrar', 'registrar@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'Academic', 'Registrar', 'ADMIN'),

-- Advisor (only the one linked to Amina)
(4, 'advisor_sse', 'advisor.sse@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'Fatima', 'Alaoui', 'ADVISOR'),

-- Students
(23, 'cs_senior_amina', 'amina.cs@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'Amina', 'Berrada', 'STUDENT'),
(24, 'cs_freshman_youssef', 'youssef.cs@aui.ma', '$2b$10$c.qM7eQpiGSiKwltwNqdjOKWCd9LpRW8.hwSBhZM3k3AcRHgEWQr.', 'Youssef', 'Bennani', 'STUDENT');

-- ==========================================================
