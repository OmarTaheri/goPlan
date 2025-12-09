-- 3. PROGRAMS (Majors, Minors, Concentrations)
-- ==========================================================
INSERT INTO programs (program_id, name, code, school, type, total_credits_required, catalog_year, parent_program_id, minor_required, concentrations_available, free_electives_credits, prerequisite_note) VALUES
-- MAJORS
(1, 'Bachelor of Business Administration', 'BBA', 'SBA', 'MAJOR', 130, '2019-2021', NULL, 'CONDITIONAL', 'REQUIRED', 9, NULL),
(2, 'Bachelor of Arts in Communication Studies', 'BACS', 'SHSS', 'MAJOR', 124, '2019-2021', NULL, 'YES', 'REQUIRED', 9, NULL),
(3, 'Bachelor of Science in Computer Science', 'BSCSC', 'SSE', 'MAJOR', 136, '2019-2021', NULL, 'YES', 'NOT_AVAILABLE', 6, NULL),

-- BBA CONCENTRATIONS (Parent: BBA = 1)
(10, 'Finance', 'CONC-FIN', 'SBA', 'CONCENTRATION', 15, NULL, 1, NULL, NULL, 0, NULL),
(11, 'Management', 'CONC-MGT', 'SBA', 'CONCENTRATION', 15, NULL, 1, NULL, NULL, 0, NULL),
(12, 'Marketing', 'CONC-MKT', 'SBA', 'CONCENTRATION', 15, NULL, 1, NULL, NULL, 0, NULL),
(13, 'International Business', 'CONC-INT', 'SBA', 'CONCENTRATION', 15, NULL, 1, NULL, NULL, 0, NULL),
(14, 'Logistics & Supply Chain', 'CONC-SCM', 'SBA', 'CONCENTRATION', 15, NULL, 1, NULL, NULL, 0, NULL),

-- BACS CONCENTRATIONS (Parent: BACS = 2)
(20, 'Media Production', 'CONC-MED', 'SHSS', 'CONCENTRATION', 12, NULL, 2, NULL, NULL, 0, NULL),
(21, 'Strategic Communication', 'CONC-STR', 'SHSS', 'CONCENTRATION', 9, NULL, 2, NULL, NULL, 0, NULL),

-- MINORS
(30, 'Leadership', 'MIN-LDR', 'SHSS', 'MINOR', 16, NULL, NULL, NULL, NULL, 0, NULL),
(31, 'Computer Science', 'MIN-CSC', 'SSE', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, 'CSC 1401 is a prerequisite for this minor and may not be in the student major core'),
(32, 'Mathematics', 'MIN-MTH', 'SSE', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(33, 'International Studies', 'MIN-INS', 'SHSS', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(34, 'Human Resource Development', 'MIN-HRD', 'SHSS', 'MINOR', 16, NULL, NULL, NULL, NULL, 0, NULL),
(35, 'Organizational Studies', 'MIN-ORG', 'SHSS', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(36, 'Communication Studies', 'MIN-COM', 'SHSS', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(37, 'Gender Studies', 'MIN-GND', 'SHSS', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(38, 'African Studies', 'MIN-AFR', 'SHSS', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(39, 'Psychology', 'MIN-PSY', 'SHSS', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(40, 'English', 'MIN-ENG', 'SHSS', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL),
(41, 'Business Administration', 'MIN-BUS', 'SBA', 'MINOR', 15, NULL, NULL, NULL, NULL, 0, NULL);

-- ==========================================================
