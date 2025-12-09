-- 4. COMPLETE COURSE CATALOG
-- ==========================================================
INSERT INTO courses (course_id, course_code, title, credits, description, is_active) VALUES

-- ============ GENERAL EDUCATION COURSES ============

-- First Year Experience (2 SCH total)
(1, 'FYE 1101', 'First Year Experience Seminar I', 1, 'Introduction to university life and academic skills', TRUE),
(2, 'FYE 1102', 'First Year Experience Seminar II', 1, 'Continuation of FYE I with career exploration', TRUE),

-- Foundations for Academic Success (2 SCH + 0 non-degree)
(3, 'FAS 0210', 'Strategic Academic Skills', 0, 'Non-degree credit course for academic skills (graduation requirement)', TRUE),
(4, 'FAS 1220', 'Introduction to Critical Thinking', 2, 'Foundations of logical and critical analysis', TRUE),

-- Arabic Courses (2 SCH - choose based on background)
(10, 'ARB 1241', 'Arabic Literature', 2, 'For Moroccan baccalaureate holders', TRUE),
(11, 'ARB 1201', 'Basic Standard Arabic', 2, 'For cultural mission baccalaureate holders', TRUE),
(12, 'ARB 1202', 'Arabic for Academic Purposes', 2, 'Intermediate Arabic for non-native speakers', TRUE),
(13, 'ARB 1203', 'Arabic for Communication Purposes', 2, 'Advanced Arabic communication skills', TRUE),
(14, 'ARA 1201', 'Arabic Beginning', 2, 'For international students with no Arabic', TRUE),
(15, 'ARA 1202', 'Arabic Intermediate', 2, 'Intermediate Arabic for international students', TRUE),
(16, 'ARA 1203', 'Arabic Advanced', 2, 'Advanced Arabic for international students', TRUE),
(17, 'ARA 3299', 'Special Topics in Arabic for Non-Native Speakers', 2, 'Special topics in Arabic', TRUE),

-- French (2 SCH)
(20, 'FRN 3210', 'Advanced French Writing and Speaking Skills', 2, 'Exit-level French requirement', TRUE),
(21, 'FRN 1201', 'French I', 2, 'Beginning French', TRUE),
(22, 'FRN 2201', 'French II', 2, 'Intermediate French', TRUE),

-- Communication (3 SCH)
(30, 'COM 1301', 'Public Speaking', 3, 'Fundamentals of oral communication', TRUE),

-- Computer Science GenEd Options (3-4 SCH)
(40, 'CSC 1300', 'Introduction to Computers', 3, 'Basic computer literacy for non-majors', TRUE),
(41, 'CSC 1401', 'Computer Programming', 4, 'Introduction to programming (Python/Java)', TRUE),

-- English (6 SCH)
(50, 'ENG 1301', 'English Composition', 3, 'Fundamentals of academic writing', TRUE),
(51, 'ENG 2301', 'Critical Thinking & Written Communication', 3, 'Advanced writing for SHSS', TRUE),
(52, 'ENG 2302', 'Writing for Business', 3, 'Business writing for SBA students', TRUE),
(53, 'ENG 2303', 'Technical Writing', 3, 'Technical documentation for SSE students', TRUE),
(54, 'ENG 2311', 'Translation', 3, 'Translation theory and practice', TRUE),
(55, 'ENG 2312', 'News Reporting: An Introduction', 3, 'Fundamentals of journalism', TRUE),
(56, 'ENG 2313', 'Nonfiction Narrative', 3, 'Creative nonfiction writing', TRUE),
(57, 'ENG 2320', 'Creative Writing', 3, 'Fiction and poetry writing', TRUE),

-- History/Political Science (3 SCH)
(60, 'HIS 1301', 'History of the Arab World', 3, 'Survey of Arab history', TRUE),
(61, 'HIS 2301', 'Contemporary World History', 3, '20th century world history', TRUE),
(62, 'HIS 2371', 'History & Cultures of Sub-Saharan Africa', 3, 'African history survey', TRUE),
(63, 'HIS 3301', 'International History: 1914 to Present', 3, 'Modern international relations history', TRUE),
(64, 'HIS 3311', 'Modern Algeria', 3, 'History of Algeria', TRUE),
(65, 'HUM 1310', 'History and Culture of the Amazigh', 3, 'Berber culture and history', TRUE),
(66, 'HUM 2302', 'Introduction to Islamic Civilization', 3, 'Islamic civilization survey', TRUE),
(67, 'PSC 2301', 'Comparative Political Systems', 3, 'Comparative government and politics', TRUE),
(68, 'PSC 2371', 'Introduction to African Politics', 3, 'African political systems', TRUE),
(69, 'PSC 3311', 'Politics in the Developing World', 3, 'Development politics', TRUE),

-- Humanities (3 SCH)
(70, 'LIT 2301', 'Major Works of World Literature', 3, 'Survey of world literary classics', TRUE),
(71, 'HUM 2306', 'Comparative Religion', 3, 'Study of world religions', TRUE),
(72, 'PHI 2301', 'Philosophical Thought', 3, 'Introduction to philosophy', TRUE),
(73, 'PHI 2302', 'History of Ideas', 3, 'Intellectual history', TRUE),
(74, 'HUM 2305', 'Introduction to Ethics', 3, 'Ethical theory and practice', TRUE),
(75, 'HUM 2307', 'Logic and Reasoning', 3, 'Formal and informal logic', TRUE),
(76, 'HUM 2371', 'Popular Culture in Africa', 3, 'African popular culture', TRUE),

-- Arts (3 SCH)
(80, 'ART 1301', 'Music & Vocal Performance', 3, 'Music appreciation and performance', TRUE),
(81, 'ART 1302', 'Dance & Choreography', 3, 'Dance techniques and choreography', TRUE),
(82, 'ART 1303', 'Painting & Sculpture', 3, 'Visual arts studio', TRUE),
(83, 'ART 1304', 'Drama & Theater', 3, 'Theater arts and performance', TRUE),
(84, 'ART 1305', 'Art Appreciation', 3, 'Survey of visual arts', TRUE),
(85, 'ART 1399', 'Special Topics in Arts', 3, 'Variable topics in arts', TRUE),
(86, 'HUM 2301', 'Introduction to Islamic Art & Architecture', 3, 'Islamic artistic traditions', TRUE),
(87, 'LIT 3370', 'Aesthetics', 3, 'Philosophy of art and beauty', TRUE),
(88, 'COM 2327', 'Art & Design Production', 3, 'Digital art and design', TRUE),

-- Mathematics (3 SCH for BBA/BACS, more for BSCSC)
(90, 'MTH 1388', 'Introductory Mathematical Thinking', 3, 'Basic math for non-STEM majors', TRUE),
(91, 'MTH 1305', 'Mathematics for Business', 3, 'Business calculus and statistics', TRUE),
(92, 'MTH 1303', 'Calculus I: Differential and Integral Calculus', 3, 'First calculus course', TRUE),
(93, 'MTH 1304', 'Discrete Mathematics', 3, 'Logic, sets, combinatorics', TRUE),
(94, 'MTH 1311', 'Pre-Calculus', 3, 'Preparation for calculus', TRUE),
(95, 'MTH 1312', 'Integral Calculus', 3, 'Integration techniques', TRUE),
(96, 'MTH 2301', 'Calculus II: Multivariable Calculus', 3, 'Multivariable calculus', TRUE),
(97, 'MTH 2303', 'Linear Algebra and Matrix Theory', 3, 'Linear algebra fundamentals', TRUE),
(98, 'MTH 2304', 'Differential Equations', 3, 'Ordinary differential equations', TRUE),
(99, 'MTH 2320', 'Linear Algebra', 3, 'Matrices and linear transformations', TRUE),
(100, 'MTH 3301', 'Probability and Statistics for Engineers', 3, 'Engineering statistics', TRUE),
(101, 'MTH 3302', 'Complex Variables and Transforms', 3, 'Complex analysis', TRUE),

-- Physical Sciences (4 SCH)
(110, 'BIO 1400', 'Environmental Biology', 4, 'Biology with environmental focus', TRUE),
(111, 'BIO 1401', 'Principles of Biology', 4, 'General biology', TRUE),
(112, 'BIO 1402', 'Biology II', 4, 'Advanced biology topics', TRUE),
(113, 'CHE 1400', 'Chemistry and the Environment', 4, 'Environmental chemistry', TRUE),
(114, 'CHE 1401', 'General Chemistry', 4, 'Introductory chemistry', TRUE),
(115, 'PHY 1400', 'Conceptual Physics', 4, 'Physics for non-majors', TRUE),
(116, 'PHY 1401', 'Physics I', 4, 'Mechanics and thermodynamics', TRUE),
(117, 'PHY 1402', 'Physics II', 4, 'Electricity and magnetism', TRUE),

-- Social Sciences (3 SCH)
(120, 'SOC 1301', 'Principles of Sociology', 3, 'Introduction to sociology', TRUE),
(121, 'GEO 1301', 'Introduction to Geography', 3, 'Physical and human geography', TRUE),
(122, 'SSC 1310', 'Introduction to Anthropology', 3, 'Cultural anthropology', TRUE),
(123, 'PSY 1301', 'Introduction to Psychology', 3, 'General psychology', TRUE),
(124, 'ECO 1300', 'Introduction to Economics', 3, 'Basic economic concepts', TRUE),

-- Civic Engagement (1 SCH)
(130, 'SLP 1101', 'Service Learning Program', 1, 'Community service requirement', TRUE),

-- ============ BBA MAJOR CORE COURSES (50 SCH) ============

-- Accounting
(200, 'ACC 2301', 'Accounting Principles I', 3, 'Financial accounting fundamentals', TRUE),
(201, 'ACC 2302', 'Accounting Principles II', 3, 'Managerial accounting', TRUE),
(202, 'ACC 3201', 'Moroccan Accounting and Taxation', 2, 'Local accounting standards', TRUE),
(203, 'ACC 4305', 'International Accounting', 3, 'Global accounting standards', TRUE),

-- Economics
(210, 'ECO 2301', 'Microeconomics', 3, 'Microeconomic theory', TRUE),
(211, 'ECO 2302', 'Macroeconomics', 3, 'Macroeconomic theory', TRUE),
(212, 'ECO 2310', 'Introduction to International Economics', 3, 'International trade basics', TRUE),
(213, 'ECO 3301', 'International Trade', 3, 'Advanced international economics', TRUE),

-- Finance
(220, 'FIN 3301', 'Principles of Finance', 3, 'Corporate finance fundamentals', TRUE),
(221, 'FIN 3302', 'Money and Banking', 3, 'Financial institutions', TRUE),
(222, 'FIN 3303', 'Corporate Financial Management', 3, 'Advanced corporate finance', TRUE),
(223, 'FIN 3305', 'Introduction to Islamic Banking and Finance', 3, 'Islamic finance principles', TRUE),
(224, 'FIN 3306', 'Corporate Governance', 3, 'Governance structures', TRUE),
(225, 'FIN 3399', 'Special Topics in Finance', 3, 'Variable finance topics', TRUE),
(226, 'FIN 4304', 'International Finance', 3, 'Global financial markets', TRUE),
(227, 'FIN 4305', 'Financial Intermediation', 3, 'Banking and intermediation', TRUE),
(228, 'FIN 4306', 'Financial Investments and Securities Analysis', 3, 'Investment analysis', TRUE),
(229, 'FIN 4307', 'Modern Investment Theory', 3, 'Portfolio theory', TRUE),
(230, 'FIN 4308', 'Financial Futures, Options and Derivatives', 3, 'Derivatives markets', TRUE),

-- General Business
(240, 'GBU 2301', 'Business Statistics', 3, 'Statistics for business', TRUE),
(241, 'GBU 3302', 'Legal Environment and Ethics', 3, 'Business law and ethics', TRUE),
(242, 'GBU 3203', 'Enterprises, Markets and the Moroccan Economy', 2, 'Local business environment', TRUE),
(243, 'GBU 3311', 'Quantitative Methods in Business', 3, 'Operations research methods', TRUE),
(244, 'GBU 3399', 'Special Topics in Business', 3, 'Variable business topics', TRUE),
(245, 'GBU 4100', 'Professional Career Development', 1, 'Career planning', TRUE),
(246, 'GBU 4308', 'Net-Economics and E-Business', 3, 'Digital business models', TRUE),

-- Management
(250, 'MGT 3301', 'Principles of Management', 3, 'Management fundamentals', TRUE),
(251, 'MGT 3302', 'Entrepreneurship', 3, 'Starting new ventures', TRUE),
(252, 'MGT 3305', 'Organizational Behavior', 3, 'Behavior in organizations', TRUE),
(253, 'MGT 3306', 'Conflict Management', 3, 'Managing organizational conflict', TRUE),
(254, 'MGT 3399', 'Special Topics in Management', 3, 'Variable management topics', TRUE),
(255, 'MGT 4301', 'Capstone: Business Policy and Corporate Strategy', 3, 'Strategic management capstone', TRUE),
(256, 'MGT 4303', 'Operations Management', 3, 'Production and operations', TRUE),
(257, 'MGT 4305', 'Advanced Organizational Behavior', 3, 'Advanced OB topics', TRUE),
(258, 'MGT 4306', 'Seminar in International Management', 3, 'Global management issues', TRUE),
(259, 'MGT 4307', 'Management of Small Enterprises', 3, 'Small business management', TRUE),
(260, 'MGT 4308', 'Management of Change', 3, 'Organizational change', TRUE),
(261, 'MGT 4310', 'Tourism and Hospitality Management', 3, 'Tourism industry management', TRUE),
(262, 'MGT 4311', 'Quality Management', 3, 'TQM and quality systems', TRUE),
(263, 'MGT 4312', 'Project Management', 3, 'Project planning and execution', TRUE),
(264, 'MGT 4314', 'Cross-Cultural Management', 3, 'Managing cultural diversity', TRUE),

-- Marketing
(270, 'MKT 3301', 'Principles of Marketing', 3, 'Marketing fundamentals', TRUE),
(271, 'MKT 3302', 'Advertising and Promotion Management', 3, 'Promotional strategies', TRUE),
(272, 'MKT 3303', 'Consumer Behavior', 3, 'Consumer psychology', TRUE),
(273, 'MKT 3304', 'Fundamentals of Services Marketing', 3, 'Services marketing', TRUE),
(274, 'MKT 3305', 'Brand Management', 3, 'Building and managing brands', TRUE),
(275, 'MKT 3399', 'Special Topics in Marketing', 3, 'Variable marketing topics', TRUE),
(276, 'MKT 4302', 'Digital Marketing', 3, 'Online marketing strategies', TRUE),
(277, 'MKT 4304', 'Marketing Research', 3, 'Research methods in marketing', TRUE),
(278, 'MKT 4305', 'Marketing Management', 3, 'Strategic marketing', TRUE),
(279, 'MKT 4306', 'International Marketing', 3, 'Global marketing', TRUE),
(280, 'MKT 4307', 'Product Management & Marketing', 3, 'Product development', TRUE),
(281, 'MKT 4311', 'E-Marketing', 3, 'Electronic marketing', TRUE),

-- MIS
(290, 'MIS 3301', 'Management Information Systems', 3, 'Business information systems', TRUE),
(291, 'MIS 3302', 'Managing IS and Technology in Global Marketplace', 3, 'Global IT management', TRUE),

-- Supply Chain Management
(295, 'SCM 3301', 'Introduction to Management Science', 3, 'Quantitative decision making', TRUE),
(296, 'SCM 3399', 'Special Topics in Logistics and SCM', 3, 'Variable SCM topics', TRUE),
(297, 'SCM 4301', 'Logistics and Supply Chain Management', 3, 'SCM fundamentals', TRUE),
(298, 'SCM 4302', 'Production and Inventory Management', 3, 'Inventory control', TRUE),
(299, 'SCM 4303', 'Management of Transportation', 3, 'Transportation logistics', TRUE),

-- Internship
(300, 'INT 4301', 'Internship (BBA)', 3, 'Professional internship for BBA', TRUE),
(301, 'INT 4302', 'Internship (BACS)', 3, 'Professional internship for Communication', TRUE),

-- ============ COMPUTER SCIENCE COURSES ============

-- CS Core
(400, 'CSC 2302', 'Data Structures', 3, 'Fundamental data structures', TRUE),
(401, 'CSC 2303', 'Advanced Programming', 3, 'Object-oriented programming', TRUE),
(402, 'CSC 2304', 'Computer Organization and Architecture', 3, 'Computer architecture', TRUE),
(403, 'CSC 2305', 'Computer Systems', 3, 'Computer systems and architecture', TRUE),
(404, 'CSC 2306', 'Object Oriented Programming', 3, 'OOP principles', TRUE),
(405, 'CSC 3315', 'Languages and Compilers', 3, 'Programming language theory', TRUE),
(406, 'CSC 3323', 'Analysis of Algorithms', 3, 'Algorithm design and analysis', TRUE),
(407, 'CSC 3324', 'Software Engineering', 3, 'Software development lifecycle', TRUE),
(408, 'CSC 3326', 'Database Systems', 3, 'Database design and SQL', TRUE),
(409, 'CSC 3351', 'Operating Systems', 3, 'OS concepts and design', TRUE),
(410, 'CSC 3371', 'Computer Communications and Networks', 3, 'Networking fundamentals', TRUE),
(411, 'CSC 3374', 'Advanced and Distributed Programming Paradigms', 3, 'Distributed systems', TRUE),
(412, 'CSC 4301', 'Introduction to Artificial Intelligence', 3, 'AI fundamentals', TRUE),
(413, 'CSC 4307', 'Agile Software Engineering and DevOps', 3, 'Agile methodologies', TRUE),
(414, 'CSC 4308', 'Cyber Security', 3, 'Information security', TRUE),
(415, 'CSC 3398', 'Special Topics in Computer Science', 3, 'Variable CS topics', TRUE),

-- Engineering courses for CS
(420, 'EGR 2302', 'Engineering Economics', 3, 'Economic analysis for engineers', TRUE),
(421, 'EGR 3331', 'Digital Logic Design', 3, 'Logic circuits', TRUE),
(422, 'EGR 3401', 'Engineering Probability and Statistics', 3, 'Statistics for engineers', TRUE),
(423, 'EGR 4300', 'Internship (Engineering)', 3, 'Engineering internship', TRUE),
(424, 'EGR 4402', 'Capstone Design', 4, 'Senior design project', TRUE),

-- ============ COMMUNICATION STUDIES COURSES ============

-- School Core (SHSS)
(500, 'SSC 2401', 'Social Statistics', 4, 'Statistics for social sciences', TRUE),
(501, 'SSC 3303', 'Research Methods', 3, 'Social science research methods', TRUE),
(502, 'SSC 4302', 'Senior Capstone for Communication', 3, 'COM senior project', TRUE),
(503, 'COM 2301', 'Professional Communication', 3, 'Business and professional comm', TRUE),

-- COM Major Core
(510, 'COM 1304', 'New Media Technology', 3, 'Digital media technologies', TRUE),
(511, 'COM 2403', 'Photography and Visual Story Telling', 4, 'Visual communication', TRUE),
(512, 'COM 2427', 'Art and Design Production', 4, 'Digital design production', TRUE),
(513, 'COM 3303', 'Global Communication and Media Policy', 3, 'International media policy', TRUE),
(514, 'COM 3320', 'Communication Theories', 3, 'Theories of communication', TRUE),
(515, 'COM 3321', 'Moroccan Media and Society', 3, 'Local media landscape', TRUE),

-- Media Production Concentration
(520, 'COM 2404', 'Introduction to Film Making', 4, 'Film production basics', TRUE),
(521, 'COM 3402', 'Advanced Film Production', 4, 'Advanced filmmaking', TRUE),
(522, 'COM 4405', 'Media Production Project Seminar', 4, 'Senior media project', TRUE),

-- Strategic Communication Concentration
(530, 'COM 3301', 'Public Relations Communication', 3, 'PR fundamentals', TRUE),
(531, 'COM 3311', 'Marketing Communication', 3, 'Marketing communications', TRUE),
(532, 'COM 3330', 'Organizational Communication', 3, 'Comm in organizations', TRUE),

-- COM Electives
(540, 'COM 3304', 'Alternative Media', 3, 'Non-mainstream media', TRUE),
(541, 'COM 3315', 'Media and Gender', 3, 'Gender representation in media', TRUE),
(542, 'COM 3328', 'Media Analysis', 3, 'Analyzing media content', TRUE),
(543, 'COM 3398', 'Special Topics in Media', 3, 'Variable media topics', TRUE),
(544, 'COM 3399', 'Special Topics in Communication', 3, 'Variable comm topics', TRUE),
(545, 'COM 4401', 'Digital Advertising Production', 4, 'Digital ad creation', TRUE),
(546, 'COM 4304', 'Communication and Development', 3, 'Comm for social change', TRUE),
(547, 'COM 3306', 'Global Communication and Media Policy', 3, 'International media', TRUE),

-- ============ HRD COURSES ============
(600, 'HRD 2300', 'Introduction to Human Resource Development', 3, 'HRD fundamentals', TRUE),
(601, 'HRD 2301', 'Business Environment and Ethics for HRD', 3, 'HRD ethics', TRUE),
(602, 'HRD 3302', 'Ethics in Professional Contexts', 3, 'Professional ethics', TRUE),
(603, 'HRD 3303', 'Training and Development', 3, 'Employee training', TRUE),
(604, 'HRD 3304', 'Strategic HRD', 3, 'Strategic HR planning', TRUE),
(605, 'HRD 3305', 'Issues in Human and Social Development', 3, 'Development issues', TRUE),
(606, 'HRD 3399', 'Special Topics in HRD', 3, 'Variable HRD topics', TRUE),
(607, 'HRD 3401', 'Human Capital Management', 4, 'Managing human capital', TRUE),
(608, 'HRD 4302', 'Needs Assessment and Organizational Effectiveness', 3, 'Needs analysis', TRUE),
(609, 'HRD 4303', 'Leadership and Management Development', 3, 'Leadership development', TRUE),
(610, 'HRD 4304', 'Consulting for HRD', 3, 'HR consulting', TRUE),
(611, 'HRD 4305', 'HRD in Public Administration', 3, 'Public sector HRD', TRUE),
(612, 'HRD 4306', 'Organizational Development and Change', 3, 'OD interventions', TRUE),
(613, 'HRD 4307', 'Career Management and Development', 3, 'Career planning', TRUE),
(614, 'HRD 4308', 'Global HRD', 3, 'International HRD', TRUE),

-- ============ LEADERSHIP MINOR COURSES ============
(620, 'LDR 1201', 'Leadership Development Institute I', 2, 'First year LDI program', TRUE),
(621, 'LDR 1202', 'Leadership Development Institute II', 2, 'Second semester LDI', TRUE),
(622, 'LDR 2301', 'Personal Development for Leadership', 3, 'Personal leadership skills', TRUE),
(623, 'LDR 4301', 'Leadership Practicum', 3, 'Applied leadership project', TRUE),

-- ============ PSYCHOLOGY COURSES ============
(630, 'PSY 1303', 'Clinical Psychology & Psychopathology', 3, 'Abnormal psychology', TRUE),
(631, 'PSY 2302', 'Cognitive Sciences & Cognitive Psychology', 3, 'Cognitive psychology', TRUE),
(632, 'PSY 2303', 'Developmental Psychology', 3, 'Human development', TRUE),
(633, 'PSY 2304', 'Psychology of Health', 3, 'Health psychology', TRUE),
(634, 'PSY 3302', 'Social/Organizational Psychology', 3, 'Social psychology', TRUE),
(635, 'PSY 3305', 'Interpersonal Relations and Conflict Resolution', 3, 'Conflict skills', TRUE),
(636, 'PSY 3306', 'Human Sexuality and Gender', 3, 'Gender psychology', TRUE),

-- ============ INTERNATIONAL STUDIES COURSES ============
(640, 'INS 2301', 'Theories of International Relations', 3, 'IR theory', TRUE),
(641, 'INS 3303', 'International Law & Organizations', 3, 'International law', TRUE),
(642, 'INS 3371', 'Africa in World Politics', 3, 'Africa in IR', TRUE),
(643, 'INS 3372', 'Conflict in Contemporary Africa', 3, 'African conflicts', TRUE),
(644, 'INS 3373', 'US Relations with Sub-Saharan Africa', 3, 'US-Africa relations', TRUE),
(645, 'INS 3374', 'EU Relations with Sub-Saharan Africa', 3, 'EU-Africa relations', TRUE),

-- ============ GENDER STUDIES COURSES ============
(650, 'SSC 2315', 'Sex, Gender and Power', 3, 'Gender theory', TRUE),
(651, 'SSC 3311', 'Women and Economic Development', 3, 'Gender and development', TRUE),
(652, 'SSC 3316', 'Gender, Politics and Society', 3, 'Gender in politics', TRUE),
(653, 'SSC 3398', 'Special Topics in Gender Studies', 3, 'Variable gender topics', TRUE),

-- ============ AFRICAN STUDIES COURSES ============
(660, 'SSC 2371', 'Ethnography in Africa', 3, 'African ethnography', TRUE),
(661, 'SSC 3371', 'Urbanization in Sub-Saharan Africa', 3, 'African urbanization', TRUE),
(662, 'SSC 3372', 'Political Economy of Development in Africa', 3, 'African development', TRUE),
(663, 'SSC 3379', 'Special Topics in African Studies', 3, 'Variable Africa topics', TRUE),

-- ============ LITERATURE COURSES ============
(670, 'LIT 3310', 'American Literature: Survey(s)', 3, 'American lit survey', TRUE),
(671, 'LIT 3371', 'African Literature', 3, 'African lit survey', TRUE),
(672, 'LIT 3373', 'British Literature: Survey(s)', 3, 'British lit survey', TRUE),
(673, 'LIT 3374', 'French Literature: Survey(s)', 3, 'French lit survey', TRUE),
(674, 'LIT 3375', 'Moroccan Literature: Survey(s)', 3, 'Moroccan lit survey', TRUE);

-- ==========================================================
