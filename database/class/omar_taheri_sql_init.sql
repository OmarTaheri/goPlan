-- ==========================================
-- GoPlan Database Schema (MySQL Compatible)
-- Complete Database with Defaults, Constraints,
-- Triggers, Views, CTEs, and Stored Procedures
-- ==========================================

DROP DATABASE IF EXISTS goplan;
CREATE DATABASE goplan;
USE goplan;

-- 1. USER MANAGEMENT

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'STUDENT' CHECK (role IN ('ADMIN', 'ADVISOR', 'STUDENT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Simple constraints without regex
    CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50),
    CONSTRAINT chk_email_has_at CHECK (email LIKE '%@%.%'),
    CONSTRAINT chk_email_length CHECK (LENGTH(email) >= 5),
    CONSTRAINT chk_password_not_empty CHECK (LENGTH(password_hash) >= 8),
    CONSTRAINT chk_first_name_length CHECK (first_name IS NULL OR LENGTH(first_name) >= 1),
    CONSTRAINT chk_last_name_length CHECK (last_name IS NULL OR LENGTH(last_name) >= 1)
);

CREATE TABLE semesters (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    term VARCHAR(10) CHECK (term IN ('FALL', 'SPRING', 'SUMMER')),
    year INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date),
    CONSTRAINT chk_semester_year CHECK (year >= 1900 AND year <= 2100),
    CONSTRAINT uk_semester_term_year UNIQUE (term, year)
);

-- 2. CATALOG & RULES (Admin Managed)

CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT chk_course_credits CHECK (credits >= 1 AND credits <= 12),
    CONSTRAINT chk_course_code_length CHECK (LENGTH(course_code) >= 4 AND LENGTH(course_code) <= 10),
    CONSTRAINT chk_course_title_length CHECK (LENGTH(title) >= 2)
);

CREATE TABLE course_dependencies (
    dependency_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    dependency_course_id INT,
    dependency_type VARCHAR(20) DEFAULT 'PREREQUISITE' CHECK (dependency_type IN ('PREREQUISITE', 'COREQUISITE', 'STATUS')),
    logic_set_id INT DEFAULT 1,
    required_status VARCHAR(20) CHECK (required_status IN ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR')),
    note VARCHAR(255),
    
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (dependency_course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_no_self_dependency CHECK (course_id != dependency_course_id),
    CONSTRAINT chk_logic_set_positive CHECK (logic_set_id > 0),
    CONSTRAINT uk_course_dependency UNIQUE (course_id, dependency_course_id, dependency_type)
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
    minor_required VARCHAR(20) DEFAULT 'NO' CHECK (minor_required IN ('YES', 'NO', 'CONDITIONAL')),
    concentrations_available VARCHAR(20) DEFAULT 'NOT_AVAILABLE' CHECK (concentrations_available IN ('REQUIRED', 'OPTIONAL', 'NOT_AVAILABLE')),
    free_electives_credits INT DEFAULT 0,
    prerequisite_note TEXT,
    
    FOREIGN KEY (parent_program_id) REFERENCES programs(program_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_program_credits CHECK (total_credits_required > 0 AND total_credits_required <= 200),
    CONSTRAINT chk_free_electives CHECK (free_electives_credits >= 0),
    CONSTRAINT chk_program_name_length CHECK (LENGTH(name) >= 2)
);

CREATE TABLE program_requirement_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    name VARCHAR(100) NOT NULL,
    credits_required INT DEFAULT 0,
    min_courses_required INT DEFAULT 0,
    parent_group_id INT,
    
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_group_id) REFERENCES program_requirement_groups(group_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_group_credits_positive CHECK (credits_required >= 0),
    CONSTRAINT chk_min_courses_positive CHECK (min_courses_required >= 0)
);

CREATE TABLE requirement_group_courses (
    link_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    course_id INT,
    is_mandatory BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (group_id) REFERENCES program_requirement_groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT uk_group_course UNIQUE (group_id, course_id)
);

-- 3. RECOMMENDED PATH ("Default Classes")

CREATE TABLE recommended_sequence (
    sequence_id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    course_id INT NULL,
    requirement_group_id INT NULL,
    semester_number INT NOT NULL,
    recommended_order INT DEFAULT 1,
    
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (requirement_group_id) REFERENCES program_requirement_groups(group_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_semester_number_positive CHECK (semester_number >= 1 AND semester_number <= 12),
    CONSTRAINT chk_recommended_order_positive CHECK (recommended_order >= 1),
    CONSTRAINT check_course_or_group CHECK (
        (course_id IS NOT NULL AND requirement_group_id IS NULL) OR 
        (course_id IS NULL AND requirement_group_id IS NOT NULL)
    )
);

-- 4. STUDENT DATA

CREATE TABLE student_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    advisor_id INT,
    enrollment_year INT,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Constraints (advisor self-reference enforced via triggers below)
    CONSTRAINT chk_enrollment_year CHECK (enrollment_year >= 1900 AND enrollment_year <= 2100)
);

CREATE TABLE student_programs (
    student_program_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    program_id INT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('MAJOR', 'MINOR', 'CONCENTRATION')),
    is_primary BOOLEAN DEFAULT TRUE,
    declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT uk_student_program UNIQUE (student_id, program_id)
);

CREATE TABLE student_transcript (
    transcript_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_id INT,
    semester_id INT,
    grade VARCHAR(5),
    status VARCHAR(20) CHECK (status IN ('COMPLETED', 'FAILED', 'IN_PROGRESS', 'TRANSFER')),
    credits_earned INT DEFAULT 0,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_credits_earned_positive CHECK (credits_earned >= 0),
    CONSTRAINT chk_grade_length CHECK (grade IS NULL OR (LENGTH(grade) >= 1 AND LENGTH(grade) <= 5)),
    CONSTRAINT uk_student_course_semester UNIQUE (student_id, course_id, semester_id)
);

-- Plan Drafts (support multiple named plans per student)
CREATE TABLE student_plan_drafts (
    draft_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Default Plan',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_plan_name_length CHECK (LENGTH(name) >= 1)
);

CREATE TABLE student_plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    draft_id INT,
    course_id INT,
    semester_number INT NOT NULL DEFAULT 1,
    semester_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    prereqs_met BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (draft_id) REFERENCES student_plan_drafts(draft_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_plan_semester_number CHECK (semester_number >= 1 AND semester_number <= 12),
    CONSTRAINT chk_semester_order_positive CHECK (semester_order >= 0),
    CONSTRAINT uk_plan_course_semester UNIQUE (draft_id, course_id, semester_number)
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
    
    -- Constraints
    CONSTRAINT chk_plan_semester_year CHECK (year >= 1900 AND year <= 2100),
    CONSTRAINT chk_plan_sem_number_range CHECK (semester_number >= 1 AND semester_number <= 12),
    CONSTRAINT uk_draft_semester UNIQUE (draft_id, semester_number)
);

-- 5. ADVISOR APPROVAL

CREATE TABLE semester_approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    semester_id INT,
    advisor_id INT,
    approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'NEEDS_REVISION')),
    advisor_comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT uk_student_semester_approval UNIQUE (student_id, semester_id)
);

-- 6. AUTHENTICATION & REFRESH TOKENS

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
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_token_hash_length CHECK (LENGTH(token_hash) >= 32)
);

-- 7. PROGRAM MINOR RULES (Whitelist/Blacklist)

CREATE TABLE program_minor_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    minor_program_id INT NOT NULL,
    rule_type VARCHAR(10) CHECK (rule_type IN ('ALLOWED', 'FORBIDDEN')),
    
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    FOREIGN KEY (minor_program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_different_programs CHECK (program_id != minor_program_id),
    CONSTRAINT uk_program_minor UNIQUE (program_id, minor_program_id)
);

-- 8. INDEXES FOR PERFORMANCE

CREATE INDEX idx_user_tokens ON refresh_tokens(user_id, revoked, expires_at);
CREATE INDEX idx_token_lookup ON refresh_tokens(token_hash, revoked);
CREATE INDEX idx_advisor_assignment ON student_profiles(advisor_id, user_id);
CREATE INDEX idx_plan_drafts ON student_plan_drafts(student_id, is_default);
CREATE INDEX idx_student_plan ON student_plan(student_id, draft_id, semester_number);
CREATE INDEX idx_transcript_student_status ON student_transcript(student_id, status);
CREATE INDEX idx_transcript_course ON student_transcript(course_id);
CREATE INDEX idx_course_deps_course ON course_dependencies(course_id, dependency_type);
CREATE INDEX idx_req_group_program ON program_requirement_groups(program_id);
CREATE INDEX idx_req_group_courses ON requirement_group_courses(group_id, course_id);
CREATE INDEX idx_student_programs_lookup ON student_programs(student_id, type, is_primary);
CREATE INDEX idx_semester_active ON semesters(is_active);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_active ON courses(is_active);





-- 9. TRIGGERS

DELIMITER $$

-- 9.1 Auto-create student profile & default plan

CREATE TRIGGER trg_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.role = 'STUDENT' THEN
        INSERT INTO student_profiles (user_id, enrollment_year)
        VALUES (NEW.user_id, YEAR(CURRENT_DATE));
    END IF;
END$$

CREATE TRIGGER trg_after_student_profile_insert
AFTER INSERT ON student_profiles
FOR EACH ROW
BEGIN
    INSERT INTO student_plan_drafts (student_id, name, is_default)
    VALUES (NEW.user_id, 'Default Plan', TRUE);
END$$

-- 9.2 Ensure only one default plan per student

CREATE TRIGGER trg_before_plan_draft_insert
BEFORE INSERT ON student_plan_drafts
FOR EACH ROW
BEGIN
    -- Normalize nulls to FALSE
    IF NEW.is_default IS NULL THEN
        SET NEW.is_default = FALSE;
    END IF;

    -- Allow only one default plan per student without self-updating the table
    IF NEW.is_default = TRUE THEN
        IF EXISTS (
            SELECT 1 FROM student_plan_drafts 
            WHERE student_id = NEW.student_id AND is_default = TRUE
        ) THEN
            SET NEW.is_default = FALSE;
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_before_plan_draft_update
BEFORE UPDATE ON student_plan_drafts
FOR EACH ROW
BEGIN
    -- Normalize nulls to FALSE
    IF NEW.is_default IS NULL THEN
        SET NEW.is_default = FALSE;
    END IF;

    -- Prevent multiple defaults; require caller to clear the old default first
    IF NEW.is_default = TRUE AND OLD.is_default = FALSE THEN
        IF EXISTS (
            SELECT 1 FROM student_plan_drafts 
            WHERE student_id = NEW.student_id 
              AND is_default = TRUE
              AND draft_id != NEW.draft_id
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only one default plan is allowed per student';
        END IF;
    END IF;
END$$

-- 9.3 Auto-calculate credits earned based on grade

CREATE TRIGGER trg_before_transcript_insert
BEFORE INSERT ON student_transcript
FOR EACH ROW
BEGIN
    DECLARE course_credits INT;
    DECLARE grade_passing BOOLEAN;
    
    SELECT credits INTO course_credits 
    FROM courses WHERE course_id = NEW.course_id;
    
    SET grade_passing = CASE COALESCE(UPPER(NEW.grade), '')
        WHEN 'A+' THEN TRUE WHEN 'A' THEN TRUE WHEN 'A-' THEN TRUE
        WHEN 'B+' THEN TRUE WHEN 'B' THEN TRUE WHEN 'B-' THEN TRUE
        WHEN 'C+' THEN TRUE WHEN 'C' THEN TRUE WHEN 'C-' THEN TRUE
        WHEN 'D+' THEN TRUE WHEN 'D' THEN TRUE WHEN 'D-' THEN TRUE
        WHEN 'P' THEN TRUE WHEN 'TR' THEN TRUE
        ELSE FALSE
    END;
    
    IF NEW.status = 'COMPLETED' AND grade_passing THEN
        SET NEW.credits_earned = course_credits;
    ELSEIF NEW.status = 'IN_PROGRESS' THEN
        SET NEW.credits_earned = 0;
    ELSEIF NEW.status = 'TRANSFER' THEN
        SET NEW.credits_earned = COALESCE(NEW.credits_earned, course_credits);
    ELSE
        SET NEW.credits_earned = 0;
    END IF;
END$$

CREATE TRIGGER trg_before_transcript_update
BEFORE UPDATE ON student_transcript
FOR EACH ROW
BEGIN
    DECLARE course_credits INT;
    DECLARE grade_passing BOOLEAN;
    
    SELECT credits INTO course_credits 
    FROM courses WHERE course_id = NEW.course_id;
    
    SET grade_passing = CASE COALESCE(UPPER(NEW.grade), '')
        WHEN 'A+' THEN TRUE WHEN 'A' THEN TRUE WHEN 'A-' THEN TRUE
        WHEN 'B+' THEN TRUE WHEN 'B' THEN TRUE WHEN 'B-' THEN TRUE
        WHEN 'C+' THEN TRUE WHEN 'C' THEN TRUE WHEN 'C-' THEN TRUE
        WHEN 'D+' THEN TRUE WHEN 'D' THEN TRUE WHEN 'D-' THEN TRUE
        WHEN 'P' THEN TRUE WHEN 'TR' THEN TRUE
        ELSE FALSE
    END;
    
    IF NEW.status = 'COMPLETED' AND grade_passing THEN
        SET NEW.credits_earned = course_credits;
    ELSEIF NEW.status = 'IN_PROGRESS' THEN
        SET NEW.credits_earned = 0;
    ELSEIF NEW.status = 'TRANSFER' THEN
        SET NEW.credits_earned = COALESCE(NEW.credits_earned, course_credits);
    ELSEIF NEW.status = 'FAILED' THEN
        SET NEW.credits_earned = 0;
    END IF;
END$$

-- 9.4 Validate advisor role assignment

CREATE TRIGGER trg_before_student_profile_insert_advisor
BEFORE INSERT ON student_profiles
FOR EACH ROW
BEGIN
    DECLARE advisor_role VARCHAR(20);
    
    IF NEW.advisor_id IS NOT NULL THEN
        IF NEW.advisor_id = NEW.user_id THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Student cannot be their own advisor';
        END IF;
        
        SELECT role INTO advisor_role 
        FROM users WHERE user_id = NEW.advisor_id;
        
        IF advisor_role != 'ADVISOR' THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Assigned user is not an advisor';
        END IF;
    END IF;
END$$

-- 9.5 Prevent modification of locked semesters

CREATE TRIGGER trg_before_plan_update
BEFORE UPDATE ON student_plan
FOR EACH ROW
BEGIN
    DECLARE semester_locked BOOLEAN;
    
    SELECT is_locked INTO semester_locked
    FROM student_plan_semesters
    WHERE draft_id = OLD.draft_id AND semester_number = OLD.semester_number;
    
    IF semester_locked = TRUE THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot modify courses in a locked semester';
    END IF;
END$$

CREATE TRIGGER trg_before_plan_delete
BEFORE DELETE ON student_plan
FOR EACH ROW
BEGIN
    DECLARE semester_locked BOOLEAN;
    
    SELECT is_locked INTO semester_locked
    FROM student_plan_semesters
    WHERE draft_id = OLD.draft_id AND semester_number = OLD.semester_number;
    
    IF semester_locked = TRUE THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot remove courses from a locked semester';
    END IF;
END$$

-- 9.6 Auto-lock past semesters

CREATE TRIGGER trg_after_semester_update
AFTER UPDATE ON semesters
FOR EACH ROW
BEGIN
    IF NEW.end_date < CURRENT_DATE AND OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        UPDATE student_plan_semesters sps
        JOIN student_plan_drafts spd ON sps.draft_id = spd.draft_id
        SET sps.is_locked = TRUE
        WHERE sps.term = NEW.term AND sps.year = NEW.year;
    END IF;
END$$

-- 9.7 Validate student can only have one primary major

CREATE TRIGGER trg_before_student_program_insert
BEFORE INSERT ON student_programs
FOR EACH ROW
BEGIN
    IF NEW.is_primary IS NULL THEN
        SET NEW.is_primary = TRUE;
    END IF;

    -- Enforce a single primary major without self-updating the table
    IF NEW.is_primary = TRUE AND NEW.type = 'MAJOR' THEN
        IF EXISTS (
            SELECT 1 FROM student_programs 
            WHERE student_id = NEW.student_id 
              AND type = 'MAJOR' 
              AND is_primary = TRUE
        ) THEN
            SET NEW.is_primary = FALSE;
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_before_student_program_update
BEFORE UPDATE ON student_programs
FOR EACH ROW
BEGIN
    IF NEW.is_primary IS NULL THEN
        SET NEW.is_primary = TRUE;
    END IF;

    -- Prevent multiple primary majors; require caller to clear the old one first
    IF NEW.is_primary = TRUE AND NEW.type = 'MAJOR' AND OLD.is_primary = FALSE THEN
        IF EXISTS (
            SELECT 1 FROM student_programs 
            WHERE student_id = NEW.student_id 
              AND type = 'MAJOR' 
              AND is_primary = TRUE
              AND student_program_id != NEW.student_program_id
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only one primary major is allowed per student';
        END IF;
    END IF;
END$$


-- 10. STORED PROCEDURES

DELIMITER $$

-- 10.1 Update prereqs_met for all courses in a plan
CREATE PROCEDURE sp_update_prereqs_met(
    IN p_student_id INT,
    IN p_draft_id INT
)
BEGIN
    UPDATE student_plan sp
    SET prereqs_met = (
        SELECT CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM course_dependencies cd
                WHERE cd.course_id = sp.course_id
                AND cd.dependency_type = 'PREREQUISITE'
            ) THEN TRUE
            ELSE (
                SELECT COUNT(*) = 0
                FROM course_dependencies cd
                WHERE cd.course_id = sp.course_id
                AND cd.dependency_type = 'PREREQUISITE'
                AND cd.dependency_course_id NOT IN (
                    SELECT st.course_id FROM student_transcript st
                    WHERE st.student_id = p_student_id
                    AND st.status IN ('COMPLETED', 'TRANSFER')
                    UNION
                    SELECT sp2.course_id FROM student_plan sp2
                    WHERE sp2.student_id = p_student_id
                    AND sp2.draft_id = p_draft_id
                    AND sp2.semester_number < sp.semester_number
                )
            )
        END
    )
    WHERE sp.student_id = p_student_id
    AND sp.draft_id = p_draft_id;
END$$

-- 10.2 Calculate student GPA
CREATE PROCEDURE sp_calculate_gpa(
    IN p_student_id INT,
    OUT p_cumulative_gpa DECIMAL(4,3),
    OUT p_total_credits INT,
    OUT p_total_points DECIMAL(10,2)
)
BEGIN
    SELECT 
        COALESCE(
            ROUND(
                SUM(
                    c.credits * CASE st.grade
                        WHEN 'A+' THEN 4.00 WHEN 'A' THEN 4.00 WHEN 'A-' THEN 3.70
                        WHEN 'B+' THEN 3.30 WHEN 'B' THEN 3.00 WHEN 'B-' THEN 2.70
                        WHEN 'C+' THEN 2.30 WHEN 'C' THEN 2.00 WHEN 'C-' THEN 1.70
                        WHEN 'D+' THEN 1.30 WHEN 'D' THEN 1.00 WHEN 'D-' THEN 0.70
                        WHEN 'F' THEN 0.00 ELSE 0.00
                    END
                ) / NULLIF(SUM(c.credits), 0),
                3
            ),
            0.00
        ),
        COALESCE(SUM(st.credits_earned), 0),
        COALESCE(
            SUM(
                c.credits * CASE st.grade
                    WHEN 'A+' THEN 4.00 WHEN 'A' THEN 4.00 WHEN 'A-' THEN 3.70
                    WHEN 'B+' THEN 3.30 WHEN 'B' THEN 3.00 WHEN 'B-' THEN 2.70
                    WHEN 'C+' THEN 2.30 WHEN 'C' THEN 2.00 WHEN 'C-' THEN 1.70
                    WHEN 'D+' THEN 1.30 WHEN 'D' THEN 1.00 WHEN 'D-' THEN 0.70
                    WHEN 'F' THEN 0.00 ELSE 0.00
                END
            ),
            0
        )
    INTO p_cumulative_gpa, p_total_credits, p_total_points
    FROM student_transcript st
    JOIN courses c ON st.course_id = c.course_id
    WHERE st.student_id = p_student_id
    AND st.status = 'COMPLETED'
    AND st.grade NOT IN ('P', 'NP', 'W', 'I', 'TR');
END$$

-- 11.3 Initialize plan from recommended sequence

CREATE PROCEDURE sp_initialize_plan_from_template(
    IN p_student_id INT,
    IN p_program_id INT,
    IN p_draft_id INT,
    IN p_start_year INT,
    IN p_start_term VARCHAR(10)
)
BEGIN
    DECLARE v_semester_num INT DEFAULT 1;
    DECLARE v_current_term VARCHAR(10);
    DECLARE v_current_year INT;
    DECLARE v_max_semester INT;
    
    SET v_current_term = p_start_term;
    SET v_current_year = p_start_year;
    
    -- Get max semester from recommended sequence
    SELECT COALESCE(MAX(semester_number), 8) INTO v_max_semester
    FROM recommended_sequence WHERE program_id = p_program_id;
    
    -- Clear existing plan entries for this draft
    DELETE FROM student_plan WHERE draft_id = p_draft_id;
    DELETE FROM student_plan_semesters WHERE draft_id = p_draft_id;
    
    -- Create semesters and add courses
    WHILE v_semester_num <= v_max_semester DO
        -- Create semester entry
        INSERT INTO student_plan_semesters (draft_id, semester_number, term, year)
        VALUES (p_draft_id, v_semester_num, v_current_term, v_current_year);
        
        -- Add courses from recommended sequence
        INSERT INTO student_plan (student_id, draft_id, course_id, semester_number, semester_order, status)
        SELECT p_student_id, p_draft_id, rs.course_id, rs.semester_number, rs.recommended_order, 'DRAFT'
        FROM recommended_sequence rs
        WHERE rs.program_id = p_program_id
        AND rs.semester_number = v_semester_num
        AND rs.course_id IS NOT NULL;
        
        -- Advance to next term
        IF v_current_term = 'FALL' THEN
            SET v_current_term = 'SPRING';
            SET v_current_year = v_current_year + 1;
        ELSEIF v_current_term = 'SPRING' THEN
            SET v_current_term = 'FALL';
        ELSE
            SET v_current_term = 'FALL';
        END IF;
        
        SET v_semester_num = v_semester_num + 1;
    END WHILE;
    
    -- Update prereqs_met
    CALL sp_update_prereqs_met(p_student_id, p_draft_id);
END$$

-- 11.4 Check if student can take a course
CREATE PROCEDURE sp_check_course_eligibility(
    IN p_student_id INT,
    IN p_course_id INT,
    IN p_draft_id INT,
    IN p_target_semester INT,
    OUT p_eligible BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_missing_prereqs TEXT DEFAULT '';
    DECLARE v_total_credits INT;
    DECLARE v_required_status VARCHAR(20);
    DECLARE v_student_status VARCHAR(20);
    
    SET p_eligible = TRUE;
    SET p_message = '';
    
    -- Check prerequisites
    SELECT GROUP_CONCAT(c.course_code SEPARATOR ', ')
    INTO v_missing_prereqs
    FROM course_dependencies cd
    JOIN courses c ON cd.dependency_course_id = c.course_id
    WHERE cd.course_id = p_course_id
    AND cd.dependency_type = 'PREREQUISITE'
    AND cd.dependency_course_id NOT IN (
        SELECT st.course_id FROM student_transcript st
        WHERE st.student_id = p_student_id
        AND st.status IN ('COMPLETED', 'TRANSFER')
        UNION
        SELECT sp.course_id FROM student_plan sp
        WHERE sp.student_id = p_student_id
        AND sp.draft_id = p_draft_id
        AND sp.semester_number < p_target_semester
    );
    
    IF v_missing_prereqs IS NOT NULL AND v_missing_prereqs != '' THEN
        SET p_eligible = FALSE;
        SET p_message = CONCAT('Missing prerequisites: ', v_missing_prereqs);
    END IF;
    
    -- Check status requirements
    SELECT cd.required_status INTO v_required_status
    FROM course_dependencies cd
    WHERE cd.course_id = p_course_id
    AND cd.dependency_type = 'STATUS'
    LIMIT 1;
    
    IF v_required_status IS NOT NULL THEN
        SELECT COALESCE(SUM(credits_earned), 0) INTO v_total_credits
        FROM student_transcript
        WHERE student_id = p_student_id
        AND status IN ('COMPLETED', 'TRANSFER');
        
        SET v_student_status = CASE 
            WHEN v_total_credits >= 90 THEN 'SENIOR'
            WHEN v_total_credits >= 60 THEN 'JUNIOR'
            WHEN v_total_credits >= 30 THEN 'SOPHOMORE'
            ELSE 'FRESHMAN'
        END;
        
        IF (v_required_status = 'SENIOR' AND v_student_status != 'SENIOR') OR
           (v_required_status = 'JUNIOR' AND v_student_status NOT IN ('JUNIOR', 'SENIOR')) OR
           (v_required_status = 'SOPHOMORE' AND v_student_status = 'FRESHMAN') THEN
            SET p_eligible = FALSE;
            SET p_message = CONCAT(p_message, IF(p_message != '', '; ', ''), 
                'Requires ', v_required_status, ' standing');
        END IF;
    END IF;
END$$

-- 11.5 Degree audit - check completion status

CREATE PROCEDURE sp_degree_audit(
    IN p_student_id INT,
    IN p_program_id INT
)
BEGIN
    SELECT 
        prg.group_id,
        prg.name AS requirement_name,
        prg.credits_required,
        prg.min_courses_required,
        COALESCE(completed.credits_completed, 0) AS credits_completed,
        COALESCE(completed.courses_completed, 0) AS courses_completed,
        CASE 
            WHEN prg.credits_required > 0 AND COALESCE(completed.credits_completed, 0) >= prg.credits_required THEN 'COMPLETE'
            WHEN prg.min_courses_required > 0 AND COALESCE(completed.courses_completed, 0) >= prg.min_courses_required THEN 'COMPLETE'
            WHEN COALESCE(completed.credits_completed, 0) > 0 OR COALESCE(completed.courses_completed, 0) > 0 THEN 'IN_PROGRESS'
            ELSE 'NOT_STARTED'
        END AS status
    FROM program_requirement_groups prg
    LEFT JOIN (
        SELECT 
            rgc.group_id,
            SUM(st.credits_earned) AS credits_completed,
            COUNT(DISTINCT st.course_id) AS courses_completed
        FROM requirement_group_courses rgc
        JOIN student_transcript st ON rgc.course_id = st.course_id
        WHERE st.student_id = p_student_id
        AND st.status IN ('COMPLETED', 'TRANSFER')
        GROUP BY rgc.group_id
    ) completed ON prg.group_id = completed.group_id
    WHERE prg.program_id = p_program_id
    ORDER BY prg.group_id;
END$$



-- Return to standard delimiter for view definitions
DELIMITER ;

-- 11. VIEWS

-- 11.1 Student transcript with full details

CREATE OR REPLACE VIEW vw_student_transcript AS
SELECT 
    st.transcript_id,
    st.student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    c.course_code,
    c.title AS course_title,
    c.credits AS course_credits,
    st.credits_earned,
    st.grade,
    CASE st.grade
        WHEN 'A+' THEN 4.00 WHEN 'A' THEN 4.00 WHEN 'A-' THEN 3.70
        WHEN 'B+' THEN 3.30 WHEN 'B' THEN 3.00 WHEN 'B-' THEN 2.70
        WHEN 'C+' THEN 2.30 WHEN 'C' THEN 2.00 WHEN 'C-' THEN 1.70
        WHEN 'D+' THEN 1.30 WHEN 'D' THEN 1.00 WHEN 'D-' THEN 0.70
        WHEN 'F' THEN 0.00 ELSE NULL
    END AS grade_points,
    st.status,
    s.name AS semester_name,
    s.term,
    s.year
FROM student_transcript st
JOIN users u ON st.student_id = u.user_id
JOIN courses c ON st.course_id = c.course_id
JOIN semesters s ON st.semester_id = s.semester_id
;

-- 12.2 Student GPA and progress summary

CREATE OR REPLACE VIEW vw_student_progress AS
SELECT 
    u.user_id AS student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    sp_main.program_id AS primary_program_id,
    p.name AS primary_program_name,
    p.total_credits_required,
    COALESCE(credits.total_earned, 0) AS total_credits_earned,
    ROUND((COALESCE(credits.total_earned, 0) / p.total_credits_required) * 100, 1) AS completion_percentage,
    COALESCE(gpa.cumulative_gpa, 0.00) AS cumulative_gpa,
    CASE 
        WHEN COALESCE(credits.total_earned, 0) >= 90 THEN 'SENIOR'
        WHEN COALESCE(credits.total_earned, 0) >= 60 THEN 'JUNIOR'
        WHEN COALESCE(credits.total_earned, 0) >= 30 THEN 'SOPHOMORE'
        ELSE 'FRESHMAN'
    END AS academic_standing,
    prof.enrollment_year,
    CONCAT(adv.first_name, ' ', adv.last_name) AS advisor_name
FROM users u
JOIN student_profiles prof ON u.user_id = prof.user_id
LEFT JOIN student_programs sp_main ON u.user_id = sp_main.student_id AND sp_main.is_primary = TRUE AND sp_main.type = 'MAJOR'
LEFT JOIN programs p ON sp_main.program_id = p.program_id
LEFT JOIN users adv ON prof.advisor_id = adv.user_id
LEFT JOIN (
    SELECT student_id, SUM(credits_earned) AS total_earned
    FROM student_transcript
    WHERE status IN ('COMPLETED', 'TRANSFER')
    GROUP BY student_id
) credits ON u.user_id = credits.student_id
LEFT JOIN (
    SELECT 
        st.student_id,
        ROUND(
            SUM(
                c.credits * CASE st.grade
                    WHEN 'A+' THEN 4.00 WHEN 'A' THEN 4.00 WHEN 'A-' THEN 3.70
                    WHEN 'B+' THEN 3.30 WHEN 'B' THEN 3.00 WHEN 'B-' THEN 2.70
                    WHEN 'C+' THEN 2.30 WHEN 'C' THEN 2.00 WHEN 'C-' THEN 1.70
                    WHEN 'D+' THEN 1.30 WHEN 'D' THEN 1.00 WHEN 'D-' THEN 0.70
                    WHEN 'F' THEN 0.00 ELSE 0.00
                END
            ) / NULLIF(SUM(c.credits), 0),
            3
        ) AS cumulative_gpa
    FROM student_transcript st
    JOIN courses c ON st.course_id = c.course_id
    WHERE st.status = 'COMPLETED'
    AND st.grade NOT IN ('P', 'NP', 'W', 'I', 'TR')
    GROUP BY st.student_id
) gpa ON u.user_id = gpa.student_id
WHERE u.role = 'STUDENT';

-- 11.3 Current semester enrollment

CREATE OR REPLACE VIEW vw_current_enrollment AS
SELECT 
    st.student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    c.course_code,
    c.title AS course_title,
    c.credits,
    st.status
FROM student_transcript st
JOIN users u ON st.student_id = u.user_id
JOIN courses c ON st.course_id = c.course_id
JOIN semesters s ON st.semester_id = s.semester_id
WHERE s.is_active = TRUE
AND st.status = 'IN_PROGRESS';

-- 11.4 Student plan overview with course details

CREATE OR REPLACE VIEW vw_student_plan_detail AS
SELECT 
    sp.plan_id,
    sp.student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    spd.draft_id,
    spd.name AS plan_name,
    spd.is_default,
    sps.semester_number,
    sps.term,
    sps.year,
    sps.is_locked,
    c.course_code,
    c.title AS course_title,
    c.credits,
    sp.status AS plan_status,
    sp.prereqs_met,
    sp.semester_order
FROM student_plan sp
JOIN users u ON sp.student_id = u.user_id
JOIN student_plan_drafts spd ON sp.draft_id = spd.draft_id
JOIN student_plan_semesters sps ON sp.draft_id = sps.draft_id AND sp.semester_number = sps.semester_number
JOIN courses c ON sp.course_id = c.course_id
ORDER BY sp.student_id, spd.draft_id, sps.semester_number, sp.semester_order;

-- 11.5 Advisor's student list with status

CREATE OR REPLACE VIEW vw_advisor_students AS
SELECT 
    prof.advisor_id,
    CONCAT(adv.first_name, ' ', adv.last_name) AS advisor_name,
    u.user_id AS student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    u.email AS student_email,
    p.name AS program_name,
    prog.completion_percentage,
    prog.cumulative_gpa,
    prog.academic_standing,
    COALESCE(pending.pending_approvals, 0) AS pending_approvals
FROM student_profiles prof
JOIN users u ON prof.user_id = u.user_id
JOIN users adv ON prof.advisor_id = adv.user_id
LEFT JOIN student_programs sp ON u.user_id = sp.student_id AND sp.is_primary = TRUE
LEFT JOIN programs p ON sp.program_id = p.program_id
LEFT JOIN vw_student_progress prog ON u.user_id = prog.student_id
LEFT JOIN (
    SELECT student_id, COUNT(*) AS pending_approvals
    FROM semester_approvals
    WHERE approval_status = 'PENDING'
    GROUP BY student_id
) pending ON u.user_id = pending.student_id
WHERE prof.advisor_id IS NOT NULL;

-- 11.6 Course prerequisites chain

CREATE OR REPLACE VIEW vw_course_prerequisites AS
SELECT 
    c.course_id,
    c.course_code,
    c.title AS course_title,
    cd.dependency_type,
    cd.logic_set_id,
    prereq.course_code AS prereq_code,
    prereq.title AS prereq_title,
    cd.required_status,
    cd.note
FROM courses c
LEFT JOIN course_dependencies cd ON c.course_id = cd.course_id
LEFT JOIN courses prereq ON cd.dependency_course_id = prereq.course_id
WHERE c.is_active = TRUE
ORDER BY c.course_code, cd.logic_set_id;

-- 11.7 Program requirements summary

CREATE OR REPLACE VIEW vw_program_requirements AS
SELECT 
    p.program_id,
    p.name AS program_name,
    p.code AS program_code,
    p.type AS program_type,
    p.total_credits_required,
    p.catalog_year,
    prg.group_id,
    prg.name AS requirement_group,
    prg.credits_required AS group_credits_required,
    prg.min_courses_required,
    parent_grp.name AS parent_group_name,
    GROUP_CONCAT(
        CONCAT(c.course_code, IF(rgc.is_mandatory, '*', ''))
        ORDER BY c.course_code
        SEPARATOR ', '
    ) AS courses_in_group
FROM programs p
LEFT JOIN program_requirement_groups prg ON p.program_id = prg.program_id
LEFT JOIN program_requirement_groups parent_grp ON prg.parent_group_id = parent_grp.group_id
LEFT JOIN requirement_group_courses rgc ON prg.group_id = rgc.group_id
LEFT JOIN courses c ON rgc.course_id = c.course_id
GROUP BY p.program_id, p.name, p.code, p.type, p.total_credits_required, 
         p.catalog_year, prg.group_id, prg.name, prg.credits_required,
         prg.min_courses_required, parent_grp.name
ORDER BY p.name, prg.group_id;


-- 12 Schedulaed Events

SET GLOBAL event_scheduler = ON;

DELIMITER $$

-- Clean up expired refresh tokens weekly
CREATE EVENT IF NOT EXISTS evt_cleanup_expired_tokens
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() 
    OR (revoked = TRUE AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY));
END$$

DELIMITER ;
