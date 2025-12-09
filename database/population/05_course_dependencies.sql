-- 5. COURSE DEPENDENCIES (Prerequisites & Corequisites)
-- ==========================================================

-- NOTE: logic_set_id enables OR logic:
-- Same course_id + same logic_set_id = AND (all required)
-- Same course_id + different logic_set_id = OR (satisfy any set)

INSERT INTO course_dependencies (course_id, dependency_course_id, dependency_type, logic_set_id, note) VALUES

-- GenEd Prerequisites
(30, 50, 'PREREQUISITE', 1, NULL),  -- COM 1301 requires ENG 1301
(51, 50, 'PREREQUISITE', 1, NULL),  -- ENG 2301 requires ENG 1301
(51, 30, 'PREREQUISITE', 1, NULL),  -- ENG 2301 requires COM 1301
(52, 50, 'PREREQUISITE', 1, NULL),  -- ENG 2302 requires ENG 1301
(52, 30, 'PREREQUISITE', 1, NULL),  -- ENG 2302 requires COM 1301
(53, 50, 'PREREQUISITE', 1, NULL),  -- ENG 2303 requires ENG 1301
(50, 3, 'COREQUISITE', 1, NULL),    -- ENG 1301 corequisite FAS 0210

-- History/PolSci Prerequisites
(61, 50, 'PREREQUISITE', 1, NULL),  -- HIS 2301 requires ENG 1301
(61, 4, 'PREREQUISITE', 1, NULL),   -- HIS 2301 requires FAS 1220
(67, 50, 'PREREQUISITE', 1, NULL),  -- PSC 2301 requires ENG 1301
(67, 4, 'PREREQUISITE', 1, NULL),   -- PSC 2301 requires FAS 1220
(63, 60, 'PREREQUISITE', 1, NULL),  -- HIS 3301 requires HIS 1301

-- Humanities Prerequisites
(70, 4, 'PREREQUISITE', 1, NULL),   -- LIT 2301 requires FAS 1220
(70, 50, 'PREREQUISITE', 1, NULL),  -- LIT 2301 requires ENG 1301
(72, 4, 'PREREQUISITE', 1, NULL),   -- PHI 2301 requires FAS 1220
(72, 50, 'PREREQUISITE', 1, NULL),  -- PHI 2301 requires ENG 1301

-- Math Prerequisites
(96, 92, 'PREREQUISITE', 1, NULL),  -- Calc II requires Calc I
(97, 96, 'PREREQUISITE', 1, NULL),  -- Linear Algebra requires Calc II
(98, 97, 'PREREQUISITE', 1, NULL),  -- Diff Eq requires Linear Algebra
(100, 96, 'PREREQUISITE', 1, NULL), -- Prob/Stats requires Calc II

-- Physics Prerequisites
(117, 116, 'PREREQUISITE', 1, NULL), -- Physics II requires Physics I

-- ==============================================================
-- BBA Core Prerequisites with OR Logic Examples
-- ==============================================================

-- ACC 2301 requires MTH 1305 OR MTH 1304 OR MTH 1311 (OR logic example)
(200, 91, 'PREREQUISITE', 1, NULL),  -- Set 1: MTH 1305
(200, 93, 'PREREQUISITE', 2, NULL),  -- Set 2: MTH 1304
(200, 94, 'PREREQUISITE', 3, NULL),  -- Set 3: MTH 1311

(201, 200, 'PREREQUISITE', 1, NULL), -- ACC 2302 requires ACC 2301
(202, 200, 'PREREQUISITE', 1, NULL), -- ACC 3201 requires ACC 2301
(202, 201, 'PREREQUISITE', 1, NULL), -- ACC 3201 requires ACC 2302

(210, 91, 'PREREQUISITE', 1, NULL),  -- ECO 2301 requires MTH 1305
(211, 210, 'PREREQUISITE', 1, NULL), -- ECO 2302 requires ECO 2301
(213, 211, 'PREREQUISITE', 1, NULL), -- ECO 3301 requires ECO 2302
(213, 243, 'PREREQUISITE', 1, NULL), -- ECO 3301 requires GBU 3311

(220, 201, 'PREREQUISITE', 1, NULL), -- FIN 3301 requires ACC 2302
(220, 211, 'PREREQUISITE', 1, NULL), -- FIN 3301 requires ECO 2302
(221, 220, 'PREREQUISITE', 1, NULL), -- FIN 3302 requires FIN 3301
(222, 220, 'PREREQUISITE', 1, NULL), -- FIN 3303 requires FIN 3301
(223, 220, 'PREREQUISITE', 1, NULL), -- FIN 3305 requires FIN 3301
(226, 220, 'PREREQUISITE', 1, NULL), -- FIN 4304 requires FIN 3301
(226, 243, 'PREREQUISITE', 1, NULL), -- FIN 4304 requires GBU 3311
(228, 222, 'PREREQUISITE', 1, NULL), -- FIN 4306 requires FIN 3303
(228, 243, 'PREREQUISITE', 1, NULL), -- FIN 4306 requires GBU 3311
(229, 222, 'PREREQUISITE', 1, NULL), -- FIN 4307 requires FIN 3303
(229, 243, 'PREREQUISITE', 1, NULL), -- FIN 4307 requires GBU 3311
(230, 228, 'PREREQUISITE', 1, NULL), -- FIN 4308 requires FIN 4306

(240, 91, 'PREREQUISITE', 1, NULL),  -- GBU 2301 requires MTH 1305
(243, 240, 'PREREQUISITE', 1, NULL), -- GBU 3311 requires GBU 2301

(250, 201, 'PREREQUISITE', 1, NULL), -- MGT 3301 requires ACC 2302
(250, 211, 'PREREQUISITE', 1, NULL), -- MGT 3301 requires ECO 2302
(251, 250, 'PREREQUISITE', 1, NULL), -- MGT 3302 requires MGT 3301
(251, 270, 'PREREQUISITE', 1, NULL), -- MGT 3302 requires MKT 3301
(251, 220, 'PREREQUISITE', 1, NULL), -- MGT 3302 requires FIN 3301
(252, 250, 'PREREQUISITE', 1, NULL), -- MGT 3305 requires MGT 3301
(253, 250, 'PREREQUISITE', 1, NULL), -- MGT 3306 requires MGT 3301
(253, 30, 'PREREQUISITE', 1, NULL),  -- MGT 3306 requires COM 1301
(255, 300, 'PREREQUISITE', 1, NULL), -- MGT 4301 Capstone requires Internship
(256, 250, 'PREREQUISITE', 1, NULL), -- MGT 4303 requires MGT 3301
(256, 243, 'PREREQUISITE', 1, NULL), -- MGT 4303 requires GBU 3311

(270, 201, 'PREREQUISITE', 1, NULL), -- MKT 3301 requires ACC 2302
(270, 211, 'PREREQUISITE', 1, NULL), -- MKT 3301 requires ECO 2302
(271, 270, 'PREREQUISITE', 1, NULL), -- MKT 3302 requires MKT 3301
(272, 270, 'PREREQUISITE', 1, NULL), -- MKT 3303 requires MKT 3301
(277, 270, 'PREREQUISITE', 1, NULL), -- MKT 4304 requires MKT 3301
(278, 250, 'PREREQUISITE', 1, NULL), -- MKT 4305 requires MGT 3301
(279, 250, 'PREREQUISITE', 1, NULL), -- MKT 4306 requires MGT 3301
(280, 250, 'PREREQUISITE', 1, NULL), -- MKT 4307 requires MGT 3301
(280, 270, 'PREREQUISITE', 1, NULL), -- MKT 4307 requires MKT 3301

(290, 41, 'PREREQUISITE', 1, NULL),  -- MIS 3301 requires CSC 1401 or CSC 1300
(290, 250, 'PREREQUISITE', 1, NULL), -- MIS 3301 requires MGT 3301

(295, 240, 'PREREQUISITE', 1, NULL), -- SCM 3301 requires GBU 2301
(297, 295, 'PREREQUISITE', 1, NULL), -- SCM 4301 requires SCM 3301
(298, 295, 'PREREQUISITE', 1, NULL), -- SCM 4302 requires SCM 3301
(299, 297, 'PREREQUISITE', 1, NULL), -- SCM 4303 requires SCM 4301

-- CS Core Prerequisites
(400, 41, 'PREREQUISITE', 1, NULL),  -- Data Structures requires CSC 1401
(401, 400, 'PREREQUISITE', 1, NULL), -- Advanced Programming requires Data Structures
(402, 400, 'PREREQUISITE', 1, NULL), -- Computer Architecture requires Data Structures
(402, 421, 'PREREQUISITE', 1, NULL), -- Computer Architecture requires Digital Logic
(404, 400, 'PREREQUISITE', 1, NULL), -- OOP requires Data Structures
(405, 400, 'PREREQUISITE', 1, NULL), -- Languages & Compilers requires Data Structures
(406, 400, 'PREREQUISITE', 1, NULL), -- Analysis of Algorithms requires Data Structures
(407, 400, 'PREREQUISITE', 1, NULL), -- Software Engineering requires Data Structures
(408, 407, 'PREREQUISITE', 1, NULL), -- Database Systems requires Software Engineering
(409, 400, 'PREREQUISITE', 1, NULL), -- Operating Systems requires Data Structures
(410, 400, 'PREREQUISITE', 1, NULL), -- Networks requires Data Structures
(411, 400, 'PREREQUISITE', 1, NULL), -- Distributed Programming requires Data Structures
(412, 400, 'PREREQUISITE', 1, NULL), -- AI requires Data Structures
(413, 407, 'PREREQUISITE', 1, NULL), -- Agile/DevOps requires Software Engineering
(414, 400, 'PREREQUISITE', 1, NULL), -- Cybersecurity requires Data Structures

-- Communication Prerequisites
(503, 30, 'PREREQUISITE', 1, NULL),  -- COM 2301 requires COM 1301
(510, 30, 'PREREQUISITE', 1, NULL),  -- COM 1304 requires COM 1301
(511, 510, 'PREREQUISITE', 1, NULL), -- COM 2403 requires COM 1304
(520, 510, 'PREREQUISITE', 1, NULL), -- COM 2404 requires COM 1304
(521, 520, 'PREREQUISITE', 1, NULL), -- COM 3402 requires COM 2404
(522, 521, 'PREREQUISITE', 1, NULL), -- COM 4405 requires COM 3402
(530, 510, 'PREREQUISITE', 1, NULL), -- COM 3301 requires COM 1304
(531, 500, 'PREREQUISITE', 1, NULL), -- COM 3311 requires SSC 2401
(532, 503, 'PREREQUISITE', 1, NULL), -- COM 3330 requires COM 2301
(545, 512, 'PREREQUISITE', 1, NULL), -- COM 4401 requires COM 2427

-- HRD Prerequisites
(603, 600, 'PREREQUISITE', 1, NULL), -- HRD 3303 requires HRD 2300
(604, 600, 'PREREQUISITE', 1, NULL), -- HRD 3304 requires HRD 2300
(604, 607, 'PREREQUISITE', 1, NULL), -- HRD 3304 requires HRD 3401
(607, 600, 'PREREQUISITE', 1, NULL), -- HRD 3401 requires HRD 2300
(608, 600, 'PREREQUISITE', 1, NULL), -- HRD 4302 requires HRD 2300
(608, 607, 'PREREQUISITE', 1, NULL), -- HRD 4302 requires HRD 3401
(608, 603, 'COREQUISITE', 1, NULL),  -- HRD 4302 corequisite HRD 3303
(609, 634, 'PREREQUISITE', 1, NULL), -- HRD 4303 requires PSY 3302 or MGT 3305
(610, 600, 'PREREQUISITE', 1, NULL), -- HRD 4304 requires HRD 2300
(610, 607, 'PREREQUISITE', 1, NULL), -- HRD 4304 requires HRD 3401
(610, 604, 'PREREQUISITE', 1, NULL), -- HRD 4304 requires HRD 3304
(612, 607, 'PREREQUISITE', 1, NULL), -- HRD 4306 requires HRD 3401
(612, 634, 'PREREQUISITE', 1, NULL), -- HRD 4306 requires PSY 3302
(612, 604, 'COREQUISITE', 1, NULL),  -- HRD 4306 corequisite HRD 3304
(613, 600, 'PREREQUISITE', 1, NULL), -- HRD 4307 requires HRD 2300
(613, 607, 'PREREQUISITE', 1, NULL), -- HRD 4307 requires HRD 3401
(614, 600, 'PREREQUISITE', 1, NULL), -- HRD 4308 requires HRD 2300
(614, 604, 'PREREQUISITE', 1, NULL), -- HRD 4308 requires HRD 3304

-- Psychology Prerequisites
(630, 123, 'PREREQUISITE', 1, NULL), -- PSY 1303 requires PSY 1301
(631, 123, 'PREREQUISITE', 1, NULL), -- PSY 2302 requires PSY 1301
(632, 123, 'PREREQUISITE', 1, NULL), -- PSY 2303 requires PSY 1301
(633, 123, 'PREREQUISITE', 1, NULL), -- PSY 2304 requires PSY 1301
(634, 123, 'PREREQUISITE', 1, NULL), -- PSY 3302 requires PSY 1301
(635, 123, 'PREREQUISITE', 1, NULL), -- PSY 3305 requires PSY 1301
(636, 123, 'PREREQUISITE', 1, NULL), -- PSY 3306 requires PSY 1301

-- International Studies Prerequisites
(640, 67, 'PREREQUISITE', 1, NULL),  -- INS 2301 requires PSC 2301
(641, 640, 'PREREQUISITE', 1, NULL), -- INS 3303 requires INS 2301
(68, 67, 'PREREQUISITE', 1, NULL);   -- PSC 2371 requires PSC 2301

-- ==========================================================
