-- Omar Taheri
-- 12/7/2025
-- Subject: GoPlan 

USE goplan;

-- Query 1) Student overview (name, email, advisor, programs)
SELECT
  u.user_id,
  u.username,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  prof.enrollment_year,
  CONCAT(adv.first_name, ' ', adv.last_name) AS advisor_name,
  GROUP_CONCAT(
    CONCAT(sp.type, ': ', p.name)
    ORDER BY sp.type
    SEPARATOR ' | '
  ) AS programs
FROM users u
JOIN student_profiles prof ON prof.user_id = u.user_id
LEFT JOIN users adv ON adv.user_id = prof.advisor_id
LEFT JOIN student_programs sp ON sp.student_id = u.user_id
LEFT JOIN programs p ON p.program_id = sp.program_id
WHERE u.user_id = 23
GROUP BY
  u.user_id, u.username, u.email, u.first_name, u.last_name,
  prof.enrollment_year, adv.first_name, adv.last_name;

-- Query 2) Credits earned + GPA (simple transcript summary)
SELECT
  -- Total credits earned (COMPLETED + TRANSFER)
  (SELECT COALESCE(SUM(st1.credits_earned), 0)
   FROM student_transcript st1
   WHERE st1.student_id = 23
     AND st1.status IN ('COMPLETED', 'TRANSFER')
  ) AS total_credits_earned,

  -- Credits currently in progress (uses course credits)
  (SELECT COALESCE(SUM(c2.credits), 0)
   FROM student_transcript st2
   JOIN courses c2 ON c2.course_id = st2.course_id
   WHERE st2.student_id = 23
     AND st2.status = 'IN_PROGRESS'
  ) AS in_progress_credits,

  -- Cumulative GPA (only COMPLETED + letter grades)
  (SELECT
     COALESCE(
       ROUND(
         SUM(c3.credits * CASE st3.grade
           WHEN 'A+' THEN 4.00 WHEN 'A' THEN 4.00 WHEN 'A-' THEN 3.70
           WHEN 'B+' THEN 3.30 WHEN 'B' THEN 3.00 WHEN 'B-' THEN 2.70
           WHEN 'C+' THEN 2.30 WHEN 'C' THEN 2.00 WHEN 'C-' THEN 1.70
           WHEN 'D+' THEN 1.30 WHEN 'D' THEN 1.00 WHEN 'D-' THEN 0.70
           WHEN 'F'  THEN 0.00 ELSE 0.00
         END) / NULLIF(SUM(c3.credits), 0),
         3
       ),
       0.000
     )
   FROM student_transcript st3
   JOIN courses c3 ON c3.course_id = st3.course_id
   WHERE st3.student_id = 23
     AND st3.status = 'COMPLETED'
     AND st3.grade NOT IN ('P', 'NP', 'W', 'I', 'TR')
  ) AS cumulative_gpa;

-- Query 3) Current semester courses (active semester only)
SELECT
  s.semester_id,
  s.name AS semester_name,
  s.term,
  s.year,
  c.course_code,
  c.title AS course_title,
  c.credits,
  st.status,
  st.grade
FROM student_transcript st
JOIN semesters s ON s.semester_id = st.semester_id
JOIN courses c ON c.course_id = st.course_id
WHERE st.student_id = 23
  AND s.is_active = TRUE
ORDER BY c.course_code;

-- Query 4) Advisor approvals history (including pending)
SELECT
  s.name AS semester_name,
  sa.approval_status,
  sa.submitted_at,
  sa.approved_at,
  sa.advisor_comments,
  CONCAT(a.first_name, ' ', a.last_name) AS advisor_name
FROM semester_approvals sa
JOIN semesters s ON s.semester_id = sa.semester_id
LEFT JOIN users a ON a.user_id = sa.advisor_id
WHERE sa.student_id = 23
ORDER BY s.year, FIELD(s.term, 'SPRING', 'SUMMER', 'FALL');

-- Query 5) Mandatory major courses status (BSCSC mandatory list)
SELECT
  prg.name AS requirement_group,
  c.course_code,
  c.title AS course_title,
  c.credits,
  COALESCE(st.status, 'NOT_TAKEN') AS student_status,
  st.semester_id
FROM program_requirement_groups prg
JOIN requirement_group_courses rgc
  ON rgc.group_id = prg.group_id
JOIN courses c
  ON c.course_id = rgc.course_id
LEFT JOIN student_transcript st
  ON st.student_id = 23
 AND st.course_id  = c.course_id
 AND st.status IN ('COMPLETED', 'TRANSFER', 'IN_PROGRESS', 'FAILED')
WHERE prg.program_id = 3
  AND rgc.is_mandatory = TRUE
ORDER BY prg.group_id, c.course_code;

-- Query 6) Missing prerequisites for CURRENT in-progress courses (this should return nothing to be good )
SELECT
  target.course_code AS target_course,
  prereq.course_code AS missing_prereq
FROM student_transcript st
JOIN semesters s ON s.semester_id = st.semester_id AND s.is_active = TRUE
JOIN courses target ON target.course_id = st.course_id
JOIN course_dependencies cd
  ON cd.course_id = st.course_id
 AND cd.dependency_type = 'PREREQUISITE'
JOIN courses prereq ON prereq.course_id = cd.dependency_course_id
LEFT JOIN student_transcript done
  ON done.student_id = st.student_id
 AND done.course_id  = cd.dependency_course_id
 AND done.status IN ('COMPLETED', 'TRANSFER')
WHERE st.student_id = 23
  AND st.status = 'IN_PROGRESS'
  AND done.transcript_id IS NULL
ORDER BY target.course_code, prereq.course_code;