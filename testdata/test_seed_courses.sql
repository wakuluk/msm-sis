-- Tolkien-themed catalog seed data for local development and manual testing.
-- This script is written to be rerunnable without duplicating rows.

INSERT INTO academic_school (code, name, active)
SELECT 'SLL', 'School of Lore and Letters', TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM academic_school
    WHERE code = 'SLL'
);

INSERT INTO academic_school (code, name, active)
SELECT 'SHS', 'School of Historical Studies', TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM academic_school
    WHERE code = 'SHS'
);

UPDATE academic_school
SET name = 'School of Lore and Letters',
    active = TRUE
WHERE code = 'SLL'
;

UPDATE academic_school
SET name = 'School of Historical Studies',
    active = TRUE
WHERE code = 'SHS'
;

INSERT INTO academic_department (school_id, code, name, active)
SELECT s.school_id, 'HUM', 'Humanities', TRUE
FROM academic_school s
WHERE s.code = 'SLL'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_department d
      WHERE d.school_id = s.school_id
        AND d.code = 'HUM'
  );

INSERT INTO academic_department (school_id, code, name, active)
SELECT s.school_id, 'LANG', 'Languages', TRUE
FROM academic_school s
WHERE s.code = 'SLL'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_department d
      WHERE d.school_id = s.school_id
        AND d.code = 'LANG'
  );

INSERT INTO academic_department (school_id, code, name, active)
SELECT s.school_id, 'HIST', 'History', TRUE
FROM academic_school s
WHERE s.code = 'SHS'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_department d
      WHERE d.school_id = s.school_id
        AND d.code = 'HIST'
  );

UPDATE academic_department d
SET school_id = s.school_id,
    name = 'Humanities',
    active = TRUE
FROM academic_school s
WHERE s.code = 'SLL'
  AND d.code = 'HUM'
;

UPDATE academic_department d
SET school_id = s.school_id,
    name = 'Languages',
    active = TRUE
FROM academic_school s
WHERE s.code = 'SLL'
  AND d.code = 'LANG'
;

UPDATE academic_department d
SET school_id = s.school_id,
    name = 'History',
    active = TRUE
FROM academic_school s
WHERE s.code = 'SHS'
  AND d.code = 'HIST'
;

INSERT INTO academic_subject (department_id, code, name, active)
SELECT d.department_id, 'TOLK', 'Tolkien Studies', TRUE
FROM academic_department d
WHERE d.code = 'HUM'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_subject
      WHERE code = 'TOLK'
  );

INSERT INTO academic_subject (department_id, code, name, active)
SELECT d.department_id, 'ELV', 'Elvish Languages', TRUE
FROM academic_department d
WHERE d.code = 'LANG'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_subject
      WHERE code = 'ELV'
  );

INSERT INTO academic_subject (department_id, code, name, active)
SELECT d.department_id, 'MEH', 'Middle-earth History', TRUE
FROM academic_department d
WHERE d.code = 'HIST'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_subject
      WHERE code = 'MEH'
  );

-- Academic year, academic term, and course offering statuses come from migrations.

INSERT INTO academic_year (code, name, start_date, end_date, active, is_published, year_status_id)
SELECT 'AY-2026-2027', 'Academic Year 2026-2027', '2026-08-01', '2027-08-15', TRUE, TRUE, ys.year_status_id
FROM academic_year_status ys
WHERE ys.code = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_year
      WHERE code = 'AY-2026-2027'
  );

INSERT INTO academic_year (code, name, start_date, end_date, active, is_published, year_status_id)
SELECT 'AY-2027-2028', 'Academic Year 2027-2028', '2027-08-01', '2028-08-15', FALSE, FALSE, ys.year_status_id
FROM academic_year_status ys
WHERE ys.code = 'PLANNED'
  AND NOT EXISTS (
    SELECT 1
    FROM academic_year
    WHERE code = 'AY-2027-2028'
);

UPDATE academic_year ay
SET name = 'Academic Year 2026-2027',
    start_date = '2026-08-01',
    end_date = '2027-08-15',
    active = TRUE,
    is_published = TRUE,
    year_status_id = ys.year_status_id
FROM academic_year_status ys
WHERE ys.code = 'ACTIVE'
  AND ay.code = 'AY-2026-2027';

UPDATE academic_year ay
SET name = 'Academic Year 2027-2028',
    start_date = '2027-08-01',
    end_date = '2028-08-15',
    active = FALSE,
    is_published = FALSE,
    year_status_id = ys.year_status_id
FROM academic_year_status ys
WHERE ys.code = 'PLANNED'
  AND ay.code = 'AY-2027-2028';

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'FALL-2026', 'Fall 2026', '2026-08-24', '2026-12-11', 202630, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'OPEN_FOR_REGISTRATION'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'FALL-2026'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'SPRING-2027', 'Spring 2027', '2027-01-19', '2027-05-07', 202710, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SPRING-2027'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'FALL-2027', 'Fall 2027', '2027-08-23', '2027-12-10', 202730, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'FALL-2027'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-I-2027', 'Summer I 2027', '2027-05-24', '2027-06-25', 202720, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SUMMER-I-2027'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-II-2027', 'Summer II 2027', '2027-06-28', '2027-07-30', 202721, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SUMMER-II-2027'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'SPRING-2028', 'Spring 2028', '2028-01-18', '2028-05-05', 202810, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SPRING-2028'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-I-2028', 'Summer I 2028', '2028-05-22', '2028-06-23', 202820, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SUMMER-I-2028'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-II-2028', 'Summer II 2028', '2028-06-26', '2028-07-28', 202821, ts.term_status_id, TRUE
FROM academic_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SUMMER-II-2028'
  );

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Fall 2026',
    start_date = '2026-08-24',
    end_date = '2026-12-11',
    sort_order = 202630,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'OPEN_FOR_REGISTRATION'
  AND term.code = 'FALL-2026'
;

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Spring 2027',
    start_date = '2027-01-19',
    end_date = '2027-05-07',
    sort_order = 202710,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'PLANNED'
  AND term.code = 'SPRING-2027'
;

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Fall 2027',
    start_date = '2027-08-23',
    end_date = '2027-12-10',
    sort_order = 202730,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND term.code = 'FALL-2027'
;

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer I 2027',
    start_date = '2027-05-24',
    end_date = '2027-06-25',
    sort_order = 202720,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'PLANNED'
  AND term.code = 'SUMMER-I-2027'
;

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer II 2027',
    start_date = '2027-06-28',
    end_date = '2027-07-30',
    sort_order = 202721,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'PLANNED'
  AND term.code = 'SUMMER-II-2027'
;

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Spring 2028',
    start_date = '2028-01-18',
    end_date = '2028-05-05',
    sort_order = 202810,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND term.code = 'SPRING-2028'
;

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer I 2028',
    start_date = '2028-05-22',
    end_date = '2028-06-23',
    sort_order = 202820,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND term.code = 'SUMMER-I-2028'
;

UPDATE academic_term term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer II 2028',
    start_date = '2028-06-26',
    end_date = '2028-07-28',
    sort_order = 202821,
    term_status_id = ts.term_status_id,
    active = TRUE
FROM academic_year ay, academic_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND term.code = 'SUMMER-II-2028'
;

INSERT INTO academic_term_group (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'FALL-2026-2027', 'Fall 2026-2027', '2026-08-24', '2026-12-11'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term_group term_group
      WHERE term_group.academic_year_id = ay.academic_year_id
        AND term_group.code = 'FALL-2026-2027'
  );

INSERT INTO academic_term_group (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SPRING-2026-2027', 'Spring 2026-2027', '2027-01-19', '2027-05-07'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term_group term_group
      WHERE term_group.academic_year_id = ay.academic_year_id
        AND term_group.code = 'SPRING-2026-2027'
  );

INSERT INTO academic_term_group (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SUMMER-2026-2027', 'Summer 2026-2027', '2027-05-24', '2027-07-30'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term_group term_group
      WHERE term_group.academic_year_id = ay.academic_year_id
        AND term_group.code = 'SUMMER-2026-2027'
  );

INSERT INTO academic_term_group (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'FALL-2027-2028', 'Fall 2027-2028', '2027-08-23', '2027-12-10'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term_group term_group
      WHERE term_group.academic_year_id = ay.academic_year_id
        AND term_group.code = 'FALL-2027-2028'
  );

INSERT INTO academic_term_group (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SPRING-2027-2028', 'Spring 2027-2028', '2028-01-18', '2028-05-05'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term_group term_group
      WHERE term_group.academic_year_id = ay.academic_year_id
        AND term_group.code = 'SPRING-2027-2028'
  );

INSERT INTO academic_term_group (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SUMMER-2027-2028', 'Summer 2027-2028', '2028-05-22', '2028-07-28'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term_group term_group
      WHERE term_group.academic_year_id = ay.academic_year_id
        AND term_group.code = 'SUMMER-2027-2028'
  );

UPDATE academic_term_group term_group
SET name = 'Fall 2026-2027',
    start_date = '2026-08-24',
    end_date = '2026-12-11'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND term_group.academic_year_id = ay.academic_year_id
  AND term_group.code = 'FALL-2026-2027'
;

UPDATE academic_term_group term_group
SET name = 'Spring 2026-2027',
    start_date = '2027-01-19',
    end_date = '2027-05-07'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND term_group.academic_year_id = ay.academic_year_id
  AND term_group.code = 'SPRING-2026-2027'
;

UPDATE academic_term_group term_group
SET name = 'Summer 2026-2027',
    start_date = '2027-05-24',
    end_date = '2027-07-30'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND term_group.academic_year_id = ay.academic_year_id
  AND term_group.code = 'SUMMER-2026-2027'
;

UPDATE academic_term_group term_group
SET name = 'Fall 2027-2028',
    start_date = '2027-08-23',
    end_date = '2027-12-10'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND term_group.academic_year_id = ay.academic_year_id
  AND term_group.code = 'FALL-2027-2028'
;

UPDATE academic_term_group term_group
SET name = 'Spring 2027-2028',
    start_date = '2028-01-18',
    end_date = '2028-05-05'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND term_group.academic_year_id = ay.academic_year_id
  AND term_group.code = 'SPRING-2027-2028'
;

UPDATE academic_term_group term_group
SET name = 'Summer 2027-2028',
    start_date = '2028-05-22',
    end_date = '2028-07-28'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND term_group.academic_year_id = ay.academic_year_id
  AND term_group.code = 'SUMMER-2027-2028'
;

DELETE FROM academic_term_group_term term_group_term
USING academic_term term
WHERE term.term_id = term_group_term.term_id
  AND term.code IN (
      'FALL-2026',
      'SPRING-2027',
      'SUMMER-I-2027',
      'SUMMER-II-2027',
      'FALL-2027',
      'SPRING-2028',
      'SUMMER-I-2028',
      'SUMMER-II-2028'
  )
;

DELETE FROM academic_term_group
WHERE code IN ('MAIN-2026-2027', 'MAIN-2027-2028')
;

INSERT INTO academic_term_group_term (term_group_id, term_id)
SELECT term_group.term_group_id, term.term_id
FROM academic_term_group term_group
JOIN academic_year ay ON ay.academic_year_id = term_group.academic_year_id
JOIN academic_term term ON term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2026-2027'
  AND term_group.code = 'FALL-2026-2027'
  AND term.code = 'FALL-2026'
;

INSERT INTO academic_term_group_term (term_group_id, term_id)
SELECT term_group.term_group_id, term.term_id
FROM academic_term_group term_group
JOIN academic_year ay ON ay.academic_year_id = term_group.academic_year_id
JOIN academic_term term ON term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2026-2027'
  AND term_group.code = 'SPRING-2026-2027'
  AND term.code = 'SPRING-2027'
;

INSERT INTO academic_term_group_term (term_group_id, term_id)
SELECT term_group.term_group_id, term.term_id
FROM academic_term_group term_group
JOIN academic_year ay ON ay.academic_year_id = term_group.academic_year_id
JOIN academic_term term ON term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2026-2027'
  AND term_group.code = 'SUMMER-2026-2027'
  AND term.code IN ('SUMMER-I-2027', 'SUMMER-II-2027')
;

INSERT INTO academic_term_group_term (term_group_id, term_id)
SELECT term_group.term_group_id, term.term_id
FROM academic_term_group term_group
JOIN academic_year ay ON ay.academic_year_id = term_group.academic_year_id
JOIN academic_term term ON term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2027-2028'
  AND term_group.code = 'FALL-2027-2028'
  AND term.code = 'FALL-2027'
;

INSERT INTO academic_term_group_term (term_group_id, term_id)
SELECT term_group.term_group_id, term.term_id
FROM academic_term_group term_group
JOIN academic_year ay ON ay.academic_year_id = term_group.academic_year_id
JOIN academic_term term ON term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2027-2028'
  AND term_group.code = 'SPRING-2027-2028'
  AND term.code = 'SPRING-2028'
;

INSERT INTO academic_term_group_term (term_group_id, term_id)
SELECT term_group.term_group_id, term.term_id
FROM academic_term_group term_group
JOIN academic_year ay ON ay.academic_year_id = term_group.academic_year_id
JOIN academic_term term ON term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2027-2028'
  AND term_group.code = 'SUMMER-2027-2028'
  AND term.code IN ('SUMMER-I-2028', 'SUMMER-II-2028')
;

INSERT INTO course (subject_id, course_number, active)
SELECT s.subject_id, '101', TRUE
FROM academic_subject s
WHERE s.code = 'TOLK'
  AND NOT EXISTS (
      SELECT 1
      FROM course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '101'
  );

INSERT INTO course (subject_id, course_number, active)
SELECT s.subject_id, '240', TRUE
FROM academic_subject s
WHERE s.code = 'TOLK'
  AND NOT EXISTS (
      SELECT 1
      FROM course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '240'
  );

INSERT INTO course (subject_id, course_number, active)
SELECT s.subject_id, '201', TRUE
FROM academic_subject s
WHERE s.code = 'ELV'
  AND NOT EXISTS (
      SELECT 1
      FROM course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '201'
  );

INSERT INTO course (subject_id, course_number, active)
SELECT s.subject_id, '310', TRUE
FROM academic_subject s
WHERE s.code = 'MEH'
  AND NOT EXISTS (
      SELECT 1
      FROM course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '310'
  );

INSERT INTO course (subject_id, course_number, active)
SELECT s.subject_id, '480', TRUE
FROM academic_subject s
WHERE s.code = 'TOLK'
  AND NOT EXISTS (
      SELECT 1
      FROM course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '480'
  );

INSERT INTO course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    is_current
)
SELECT c.course_id,
       1,
       'Introduction to Tolkien Studies',
       'An introduction to Tolkien''s legendarium, major themes, and the relationship between The Hobbit, The Lord of the Rings, and The Silmarillion.',
       3.00,
       3.00,
       FALSE,
       TRUE
FROM course c
JOIN academic_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '101'
  AND NOT EXISTS (
      SELECT 1
      FROM course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    is_current
)
SELECT c.course_id,
       2,
       'Introduction to Tolkien Studies: Texts and Adaptations',
       'A revised survey of Tolkien studies with expanded attention to adaptation, reception, and the cultural afterlife of Middle-earth.',
       3.00,
       3.00,
       FALSE,
       FALSE
FROM course c
JOIN academic_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '101'
  AND NOT EXISTS (
      SELECT 1
      FROM course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 2
  );

INSERT INTO course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    is_current
)
SELECT c.course_id,
       1,
       'The Fellowship and the Heroic Quest',
       'A close reading of The Fellowship of the Ring with emphasis on quest structure, friendship, and the moral imagination.',
       3.00,
       3.00,
       FALSE,
       TRUE
FROM course c
JOIN academic_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '240'
  AND NOT EXISTS (
      SELECT 1
      FROM course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    is_current
)
SELECT c.course_id,
       1,
       'Sindarin and Quenya Foundations',
       'An introductory study of Tolkien''s Elvish languages, including phonology, writing systems, and selected translated passages.',
       4.00,
       4.00,
       FALSE,
       TRUE
FROM course c
JOIN academic_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'ELV'
  AND c.course_number = '201'
  AND NOT EXISTS (
      SELECT 1
      FROM course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    is_current
)
SELECT c.course_id,
       1,
       'Kingship and Stewardship in Middle-earth',
       'A historical and political reading of rulership, succession, and legitimacy from Numenor to Gondor.',
       3.00,
       3.00,
       FALSE,
       TRUE
FROM course c
JOIN academic_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'MEH'
  AND c.course_number = '310'
  AND NOT EXISTS (
      SELECT 1
      FROM course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    is_current
)
SELECT c.course_id,
       1,
       'Independent Study in Middle-earth Cartography',
       'Supervised work on maps, movement, and spatial storytelling across Tolkien''s secondary world.',
       1.00,
       3.00,
       TRUE,
       TRUE
FROM course c
JOIN academic_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '480'
  AND NOT EXISTS (
      SELECT 1
      FROM course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code, status_code, notes) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'OPEN_FOR_DISPLAY', 'Includes a weekend film-comparison workshop.'),
        ('TOLK', '240', 1, 'AY-2026-2027', 'OPEN_FOR_DISPLAY', 'Seminar format with weekly textual analysis.'),
        ('ELV', '201', 1, 'AY-2026-2027', 'PLANNED', 'Cross-listed with linguistics discussion groups.'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'OPEN_FOR_DISPLAY', 'Independent projects require faculty approval.'),
        ('MEH', '310', 1, 'AY-2027-2028', 'PLANNED', 'Focuses on Gondor, Arnor, and the long defeat.')
)
INSERT INTO course_offering (
    course_version_id,
    academic_year_id,
    course_offering_status_id,
    notes
)
SELECT cv.course_version_id,
       ay.academic_year_id,
       cos.course_offering_status_id,
       desired_offerings.notes
FROM desired_offerings
JOIN academic_subject s ON s.code = desired_offerings.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_offerings.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_offerings.version_number
JOIN academic_year ay ON ay.code = desired_offerings.academic_year_code
JOIN course_offering_status cos ON cos.code = desired_offerings.status_code
WHERE NOT EXISTS (
    SELECT 1
    FROM course_offering co
    WHERE co.course_version_id = cv.course_version_id
      AND co.academic_year_id = ay.academic_year_id
);

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code, status_code, notes) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'OPEN_FOR_DISPLAY', 'Includes a weekend film-comparison workshop.'),
        ('TOLK', '240', 1, 'AY-2026-2027', 'OPEN_FOR_DISPLAY', 'Seminar format with weekly textual analysis.'),
        ('ELV', '201', 1, 'AY-2026-2027', 'PLANNED', 'Cross-listed with linguistics discussion groups.'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'OPEN_FOR_DISPLAY', 'Independent projects require faculty approval.'),
        ('MEH', '310', 1, 'AY-2027-2028', 'PLANNED', 'Focuses on Gondor, Arnor, and the long defeat.')
)
UPDATE course_offering co
SET course_offering_status_id = cos.course_offering_status_id,
    notes = desired_offerings.notes
FROM desired_offerings
JOIN academic_subject s ON s.code = desired_offerings.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_offerings.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_offerings.version_number
JOIN academic_year ay ON ay.code = desired_offerings.academic_year_code
JOIN course_offering_status cos ON cos.code = desired_offerings.status_code
WHERE co.course_version_id = cv.course_version_id
  AND co.academic_year_id = ay.academic_year_id
;

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027'),
        ('TOLK', '240', 1, 'AY-2026-2027'),
        ('ELV', '201', 1, 'AY-2026-2027'),
        ('TOLK', '480', 1, 'AY-2026-2027'),
        ('MEH', '310', 1, 'AY-2027-2028')
)
DELETE FROM course_offering_term cot
USING desired_offerings,
      academic_subject s,
      course c,
      course_version cv,
      academic_year ay,
      course_offering co
WHERE s.code = desired_offerings.subject_code
  AND c.subject_id = s.subject_id
  AND c.course_number = desired_offerings.course_number
  AND cv.course_id = c.course_id
  AND cv.version_number = desired_offerings.version_number
  AND ay.code = desired_offerings.academic_year_code
  AND co.course_version_id = cv.course_version_id
  AND co.academic_year_id = ay.academic_year_id
  AND cot.course_offering_id = co.course_offering_id
;

WITH desired_offering_terms(subject_code, course_number, version_number, academic_year_code, term_code) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027'),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SUMMER-I-2027'),
        ('TOLK', '240', 1, 'AY-2026-2027', 'FALL-2026'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SUMMER-II-2027'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-I-2027'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-II-2027'),
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027'),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028')
)
INSERT INTO course_offering_term (
    course_offering_id,
    term_id,
    academic_year_id
)
SELECT co.course_offering_id,
       term.term_id,
       ay.academic_year_id
FROM desired_offering_terms
JOIN academic_subject s ON s.code = desired_offering_terms.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_offering_terms.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_offering_terms.version_number
JOIN academic_year ay ON ay.code = desired_offering_terms.academic_year_code
JOIN course_offering co ON co.course_version_id = cv.course_version_id
                       AND co.academic_year_id = ay.academic_year_id
JOIN academic_term term ON term.academic_year_id = ay.academic_year_id
                       AND term.code = desired_offering_terms.term_code
;
