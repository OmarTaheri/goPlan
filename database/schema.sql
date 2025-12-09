-- ==========================================
-- GoPlan Database Schema (MySQL Compatible)
-- ==========================================

DROP DATABASE IF EXISTS goplan;
CREATE DATABASE goplan;
USE goplan;

-- ==========================================
-- 1. USER MANAGEMENT
-- ==========================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'ADVISOR', 'STUDENT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE semesters (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    term VARCHAR(10) CHECK (term IN ('FALL', 'SPRING', 'SUMMER')),
    year INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 2. CATALOG & RULES (Admin Managed)
-- ==========================================

CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE course_dependencies (
    dependency_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    dependency_course_id INT,
    dependency_type VARCHAR(20) CHECK (dependency_type IN ('PREREQUISITE', 'COREQUISITE', 'STATUS')),
    logic_set_id INT DEFAULT 1,
    required_status VARCHAR(20) CHECK (required_status IN ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR')),
    note VARCHAR(255),
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (dependency_course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE programs (
    program_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    school VARCHAR(10),
    type VARCHAR(20) CHECK (type IN ('MAJOR', 'MINOR', 'CONCENTRATION')),
    total_credits_required INT NOT NULL,
    catalog_year VARCHAR(20),
    parent_program_id INT NULL,
    minor_required VARCHAR(20) CHECK (minor_required IN ('YES', 'NO', 'CONDITIONAL')),
    concentrations_available VARCHAR(20) CHECK (concentrations_available IN ('REQUIRED', 'OPTIONAL', 'NOT_AVAILABLE')),
    free_electives_credits INT DEFAULT 0,
    prerequisite_note TEXT,
    FOREIGN KEY (parent_program_id) REFERENCES programs(program_id) ON DELETE SET NULL
);

CREATE TABLE program_requirement_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    name VARCHAR(100) NOT NULL,
    credits_required INT DEFAULT 0,
    min_courses_required INT DEFAULT 0,
    parent_group_id INT,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_group_id) REFERENCES program_requirement_groups(group_id) ON DELETE SET NULL
);

CREATE TABLE requirement_group_courses (
    link_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    course_id INT,
    is_mandatory BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES program_requirement_groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- ==========================================
-- 3. RECOMMENDED PATH ("Default Classes")
-- ==========================================

CREATE TABLE recommended_sequence (
    sequence_id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    course_id INT NULL,
    requirement_group_id INT NULL,
    semester_number INT NOT NULL,
    recommended_order INT,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (requirement_group_id) REFERENCES program_requirement_groups(group_id) ON DELETE CASCADE,
    CONSTRAINT check_course_or_group CHECK (
        (course_id IS NOT NULL AND requirement_group_id IS NULL) OR 
        (course_id IS NULL AND requirement_group_id IS NOT NULL)
    )
);

-- ==========================================
-- 4. STUDENT DATA
-- ==========================================

CREATE TABLE student_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    advisor_id INT,
    enrollment_year INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE student_programs (
    student_program_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    program_id INT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('MAJOR', 'MINOR', 'CONCENTRATION')),
    is_primary BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE
);

CREATE TABLE student_transcript (
    transcript_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_id INT,
    semester_id INT,
    grade VARCHAR(5),
    status VARCHAR(20) CHECK (status IN ('COMPLETED', 'FAILED', 'IN_PROGRESS', 'TRANSFER')),
    credits_earned INT,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE CASCADE
);

-- Plan Drafts (support multiple named plans per student)
CREATE TABLE student_plan_drafts (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Default Plan',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE student_plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    draft_id INT,
    course_id INT,
    semester_number INT NOT NULL DEFAULT 1,
    semester_order INT DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')) DEFAULT 'DRAFT',
    prereqs_met BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (draft_id) REFERENCES student_plan_drafts(draft_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE student_plan_semesters (
    plan_semester_id INT AUTO_INCREMENT PRIMARY KEY,
    draft_id INT NOT NULL,
    semester_number INT NOT NULL,
    term VARCHAR(10) CHECK (term IN ('FALL', 'SPRING', 'SUMMER')),
    year INT NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (draft_id) REFERENCES student_plan_drafts(draft_id) ON DELETE CASCADE,
    UNIQUE KEY unique_semester (draft_id, semester_number)
);

-- ==========================================
-- 5. ADVISOR APPROVAL
-- ==========================================

CREATE TABLE semester_approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    semester_id INT,
    advisor_id INT,
    approval_status VARCHAR(20) CHECK (approval_status IN ('PENDING', 'APPROVED', 'NEEDS_REVISION')),
    advisor_comments TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ==========================================
-- 6. AUTHENTICATION & REFRESH TOKENS
-- ==========================================

CREATE TABLE refresh_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- 7. PROGRAM MINOR RULES (Whitelist/Blacklist)
-- ==========================================

CREATE TABLE program_minor_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    minor_program_id INT NOT NULL,
    rule_type VARCHAR(10) CHECK (rule_type IN ('ALLOWED', 'FORBIDDEN')),
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (minor_program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    UNIQUE KEY unique_program_minor (program_id, minor_program_id)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_user_tokens ON refresh_tokens(user_id, revoked, expires_at);
CREATE INDEX idx_token_lookup ON refresh_tokens(token_hash, revoked);
CREATE INDEX idx_advisor_assignment ON student_profiles(advisor_id, user_id);
CREATE INDEX idx_plan_drafts ON student_plan_drafts(student_id, is_default);
CREATE INDEX idx_student_plan ON student_plan(student_id, draft_id, semester_number);