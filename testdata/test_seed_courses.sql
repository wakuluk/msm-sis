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

-- Academic year, academic sub term, and course offering statuses come from migrations.

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

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'FALL-2026', 'Fall 2026', '2026-08-24', '2026-12-11', 202630, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'OPEN_FOR_REGISTRATION'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'FALL-2026'
  );

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'SPRING-2027', 'Spring 2027', '2027-01-19', '2027-05-07', 202710, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'SPRING-2027'
  );

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'FALL-2027', 'Fall 2027', '2027-08-23', '2027-12-10', 202730, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'FALL-2027'
  );

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-I-2027', 'Summer I 2027', '2027-05-24', '2027-06-25', 202720, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'SUMMER-I-2027'
  );

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-II-2027', 'Summer II 2027', '2027-06-28', '2027-07-30', 202721, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'SUMMER-II-2027'
  );

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'SPRING-2028', 'Spring 2028', '2028-01-18', '2028-05-05', 202810, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'SPRING-2028'
  );

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-I-2028', 'Summer I 2028', '2028-05-22', '2028-06-23', 202820, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'SUMMER-I-2028'
  );

INSERT INTO academic_sub_term (academic_year_id, code, name, start_date, end_date, sort_order, sub_term_status_id, active)
SELECT ay.academic_year_id, 'SUMMER-II-2028', 'Summer II 2028', '2028-06-26', '2028-07-28', 202821, ts.sub_term_status_id, TRUE
FROM academic_sub_term_status ts
JOIN academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_sub_term sub_term
      WHERE sub_term.academic_year_id = ay.academic_year_id
        AND sub_term.code = 'SUMMER-II-2028'
  );

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Fall 2026',
    start_date = '2026-08-24',
    end_date = '2026-12-11',
    sort_order = 202630,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'OPEN_FOR_REGISTRATION'
  AND sub_term.code = 'FALL-2026'
;

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Spring 2027',
    start_date = '2027-01-19',
    end_date = '2027-05-07',
    sort_order = 202710,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'PLANNED'
  AND sub_term.code = 'SPRING-2027'
;

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Fall 2027',
    start_date = '2027-08-23',
    end_date = '2027-12-10',
    sort_order = 202730,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND sub_term.code = 'FALL-2027'
;

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer I 2027',
    start_date = '2027-05-24',
    end_date = '2027-06-25',
    sort_order = 202720,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'PLANNED'
  AND sub_term.code = 'SUMMER-I-2027'
;

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer II 2027',
    start_date = '2027-06-28',
    end_date = '2027-07-30',
    sort_order = 202721,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2026-2027'
  AND ts.code = 'PLANNED'
  AND sub_term.code = 'SUMMER-II-2027'
;

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Spring 2028',
    start_date = '2028-01-18',
    end_date = '2028-05-05',
    sort_order = 202810,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND sub_term.code = 'SPRING-2028'
;

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer I 2028',
    start_date = '2028-05-22',
    end_date = '2028-06-23',
    sort_order = 202820,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND sub_term.code = 'SUMMER-I-2028'
;

UPDATE academic_sub_term sub_term
SET academic_year_id = ay.academic_year_id,
    name = 'Summer II 2028',
    start_date = '2028-06-26',
    end_date = '2028-07-28',
    sort_order = 202821,
    sub_term_status_id = ts.sub_term_status_id,
    active = TRUE
FROM academic_year ay, academic_sub_term_status ts
WHERE ay.code = 'AY-2027-2028'
  AND ts.code = 'PLANNED'
  AND sub_term.code = 'SUMMER-II-2028'
;

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'FALL-2026-2027', 'Fall 2026-2027', '2026-08-24', '2026-12-11'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'FALL-2026-2027'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SPRING-2026-2027', 'Spring 2026-2027', '2027-01-19', '2027-05-07'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SPRING-2026-2027'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SUMMER-2026-2027', 'Summer 2026-2027', '2027-05-24', '2027-07-30'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SUMMER-2026-2027'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'FALL-2027-2028', 'Fall 2027-2028', '2027-08-23', '2027-12-10'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'FALL-2027-2028'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SPRING-2027-2028', 'Spring 2027-2028', '2028-01-18', '2028-05-05'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SPRING-2027-2028'
  );

INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT ay.academic_year_id, 'SUMMER-2027-2028', 'Summer 2027-2028', '2028-05-22', '2028-07-28'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND NOT EXISTS (
      SELECT 1
      FROM academic_term term
      WHERE term.academic_year_id = ay.academic_year_id
        AND term.code = 'SUMMER-2027-2028'
  );

UPDATE academic_term term
SET name = 'Fall 2026-2027',
    start_date = '2026-08-24',
    end_date = '2026-12-11'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND term.academic_year_id = ay.academic_year_id
  AND term.code = 'FALL-2026-2027'
;

UPDATE academic_term term
SET name = 'Spring 2026-2027',
    start_date = '2027-01-19',
    end_date = '2027-05-07'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND term.academic_year_id = ay.academic_year_id
  AND term.code = 'SPRING-2026-2027'
;

UPDATE academic_term term
SET name = 'Summer 2026-2027',
    start_date = '2027-05-24',
    end_date = '2027-07-30'
FROM academic_year ay
WHERE ay.code = 'AY-2026-2027'
  AND term.academic_year_id = ay.academic_year_id
  AND term.code = 'SUMMER-2026-2027'
;

UPDATE academic_term term
SET name = 'Fall 2027-2028',
    start_date = '2027-08-23',
    end_date = '2027-12-10'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND term.academic_year_id = ay.academic_year_id
  AND term.code = 'FALL-2027-2028'
;

UPDATE academic_term term
SET name = 'Spring 2027-2028',
    start_date = '2028-01-18',
    end_date = '2028-05-05'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND term.academic_year_id = ay.academic_year_id
  AND term.code = 'SPRING-2027-2028'
;

UPDATE academic_term term
SET name = 'Summer 2027-2028',
    start_date = '2028-05-22',
    end_date = '2028-07-28'
FROM academic_year ay
WHERE ay.code = 'AY-2027-2028'
  AND term.academic_year_id = ay.academic_year_id
  AND term.code = 'SUMMER-2027-2028'
;

DELETE FROM academic_term_sub_term term_sub_term
USING academic_sub_term sub_term
WHERE sub_term.sub_term_id = term_sub_term.sub_term_id
  AND sub_term.code IN (
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

DELETE FROM academic_term
WHERE code IN ('MAIN-2026-2027', 'MAIN-2027-2028')
;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id, sub_term.sub_term_id
FROM academic_term term
JOIN academic_year ay ON ay.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2026-2027'
  AND term.code = 'FALL-2026-2027'
  AND sub_term.code = 'FALL-2026'
;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id, sub_term.sub_term_id
FROM academic_term term
JOIN academic_year ay ON ay.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2026-2027'
  AND term.code = 'SPRING-2026-2027'
  AND sub_term.code = 'SPRING-2027'
;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id, sub_term.sub_term_id
FROM academic_term term
JOIN academic_year ay ON ay.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2026-2027'
  AND term.code = 'SUMMER-2026-2027'
  AND sub_term.code IN ('SUMMER-I-2027', 'SUMMER-II-2027')
;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id, sub_term.sub_term_id
FROM academic_term term
JOIN academic_year ay ON ay.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2027-2028'
  AND term.code = 'FALL-2027-2028'
  AND sub_term.code = 'FALL-2027'
;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id, sub_term.sub_term_id
FROM academic_term term
JOIN academic_year ay ON ay.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2027-2028'
  AND term.code = 'SPRING-2027-2028'
  AND sub_term.code = 'SPRING-2028'
;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id, sub_term.sub_term_id
FROM academic_term term
JOIN academic_year ay ON ay.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
WHERE ay.code = 'AY-2027-2028'
  AND term.code = 'SUMMER-2027-2028'
  AND sub_term.code IN ('SUMMER-I-2028', 'SUMMER-II-2028')
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

INSERT INTO staff (first_name, last_name, email)
SELECT 'Jane', 'Smith', 'jane.smith@msm.edu'
WHERE NOT EXISTS (
    SELECT 1
    FROM staff
    WHERE email = 'jane.smith@msm.edu'
);

INSERT INTO staff (first_name, last_name, email)
SELECT 'Alan', 'Reed', 'alan.reed@msm.edu'
WHERE NOT EXISTS (
    SELECT 1
    FROM staff
    WHERE email = 'alan.reed@msm.edu'
);

INSERT INTO staff (first_name, last_name, email)
SELECT 'Maria', 'Chen', 'maria.chen@msm.edu'
WHERE NOT EXISTS (
    SELECT 1
    FROM staff
    WHERE email = 'maria.chen@msm.edu'
);

INSERT INTO staff (first_name, last_name, email)
SELECT 'Nadia', 'Rivera', 'nadia.rivera@msm.edu'
WHERE NOT EXISTS (
    SELECT 1
    FROM staff
    WHERE email = 'nadia.rivera@msm.edu'
);

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code, notes) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'Includes a weekend film-comparison workshop.'),
        ('TOLK', '240', 1, 'AY-2026-2027', 'Seminar format with weekly textual analysis.'),
        ('ELV', '201', 1, 'AY-2026-2027', 'Cross-listed with linguistics discussion groups.'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'Independent projects require faculty approval.'),
        ('MEH', '310', 1, 'AY-2027-2028', 'Focuses on Gondor, Arnor, and the long defeat.')
)
INSERT INTO course_offering (
    course_version_id,
    academic_year_id,
    notes
)
SELECT cv.course_version_id,
       ay.academic_year_id,
       desired_offerings.notes
FROM desired_offerings
JOIN academic_subject s ON s.code = desired_offerings.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_offerings.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_offerings.version_number
JOIN academic_year ay ON ay.code = desired_offerings.academic_year_code
WHERE NOT EXISTS (
    SELECT 1
    FROM course_offering co
    WHERE co.course_version_id = cv.course_version_id
      AND co.academic_year_id = ay.academic_year_id
);

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code, notes) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'Includes a weekend film-comparison workshop.'),
        ('TOLK', '240', 1, 'AY-2026-2027', 'Seminar format with weekly textual analysis.'),
        ('ELV', '201', 1, 'AY-2026-2027', 'Cross-listed with linguistics discussion groups.'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'Independent projects require faculty approval.'),
        ('MEH', '310', 1, 'AY-2027-2028', 'Focuses on Gondor, Arnor, and the long defeat.')
)
UPDATE course_offering co
SET notes = desired_offerings.notes
FROM desired_offerings
JOIN academic_subject s ON s.code = desired_offerings.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_offerings.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_offerings.version_number
JOIN academic_year ay ON ay.code = desired_offerings.academic_year_code
WHERE co.course_version_id = cv.course_version_id
  AND co.academic_year_id = ay.academic_year_id
;

WITH desired_offering_sub_terms(subject_code, course_number, version_number, academic_year_code, sub_term_code) AS (
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
DELETE FROM course_section cs
USING desired_offering_sub_terms,
      academic_subject s,
      course c,
      course_version cv,
      academic_year ay,
      course_offering co,
      academic_sub_term sub_term
WHERE s.code = desired_offering_sub_terms.subject_code
  AND c.subject_id = s.subject_id
  AND c.course_number = desired_offering_sub_terms.course_number
  AND cv.course_id = c.course_id
  AND cv.version_number = desired_offering_sub_terms.version_number
  AND ay.code = desired_offering_sub_terms.academic_year_code
  AND co.course_version_id = cv.course_version_id
  AND co.academic_year_id = ay.academic_year_id
  AND sub_term.academic_year_id = ay.academic_year_id
  AND sub_term.code = desired_offering_sub_terms.sub_term_code
  AND cs.course_offering_id = co.course_offering_id
  AND cs.sub_term_id = sub_term.sub_term_id
;

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027'),
        ('TOLK', '240', 1, 'AY-2026-2027'),
        ('ELV', '201', 1, 'AY-2026-2027'),
        ('TOLK', '480', 1, 'AY-2026-2027'),
        ('MEH', '310', 1, 'AY-2027-2028')
)
DELETE FROM course_offering_sub_term cost
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
  AND cost.course_offering_id = co.course_offering_id
;

WITH desired_offering_sub_terms(subject_code, course_number, version_number, academic_year_code, sub_term_code) AS (
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
INSERT INTO course_offering_sub_term (
    course_offering_id,
    sub_term_id,
    academic_year_id
)
SELECT co.course_offering_id,
       sub_term.sub_term_id,
       ay.academic_year_id
FROM desired_offering_sub_terms
JOIN academic_subject s ON s.code = desired_offering_sub_terms.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_offering_sub_terms.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_offering_sub_terms.version_number
JOIN academic_year ay ON ay.code = desired_offering_sub_terms.academic_year_code
JOIN course_offering co ON co.course_version_id = cv.course_version_id
                       AND co.academic_year_id = ay.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
                           AND sub_term.code = desired_offering_sub_terms.sub_term_code
;

WITH desired_sections(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    is_honors,
    is_lab,
    status_code,
    academic_division_code,
    delivery_mode_code,
    grading_basis_code,
    credits,
    capacity,
    waitlist_allowed,
    start_date,
    end_date,
    notes
) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'OPEN', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 28, TRUE, '2027-01-19'::date, '2027-05-07'::date, 'Lecture section for general registration.'),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'B', TRUE, FALSE, 'OPEN', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 3.00, 18, TRUE, '2027-01-19'::date, '2027-05-07'::date, 'Honors section with additional seminar discussion.'),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SUMMER-I-2027', 'A', FALSE, FALSE, 'PLANNED', 'UNDERGRADUATE', 'ONLINE', 'GRADED', 3.00, 24, TRUE, '2027-05-24'::date, '2027-06-25'::date, 'Condensed online summer section.'),
        ('TOLK', '240', 1, 'AY-2026-2027', 'FALL-2026', 'A', FALSE, FALSE, 'OPEN', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 16, FALSE, '2026-08-24'::date, '2026-12-11'::date, 'Discussion-heavy seminar section.'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'OPEN', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 4.00, 20, TRUE, '2027-01-19'::date, '2027-05-07'::date, 'Language lab attached to weekly class meeting.'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, TRUE, 'OPEN', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 0.00, 20, FALSE, '2027-01-19'::date, '2027-05-07'::date, 'Required pronunciation lab.'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SUMMER-II-2027', 'A', FALSE, FALSE, 'PLANNED', 'UNDERGRADUATE', 'ONLINE', 'GRADED', 4.00, 18, TRUE, '2027-06-28'::date, '2027-07-30'::date, 'Online summer language intensive.'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-I-2027', 'A', FALSE, FALSE, 'CLOSED', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 2.00, 6, FALSE, '2027-05-24'::date, '2027-06-25'::date, 'Registrar-managed independent study placements.'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-II-2027', 'A', FALSE, FALSE, 'CLOSED', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 2.00, 6, FALSE, '2027-06-28'::date, '2027-07-30'::date, 'Registrar-managed independent study placements.'),
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', FALSE, FALSE, 'PLANNED', 'GRADUATE', 'IN_PERSON', 'GRADED', 3.00, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Graduate lecture section.'),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, FALSE, 'DRAFT', 'GRADUATE', 'IN_PERSON', 'GRADED', 3.00, 24, TRUE, '2028-01-18'::date, '2028-05-05'::date, 'Draft spring lecture section.'),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'B', FALSE, FALSE, 'DRAFT', 'GRADUATE', 'HYBRID', 'PASS_FAIL', 3.00, 18, TRUE, '2028-01-18'::date, '2028-05-05'::date, 'Draft seminar section for manual registration testing.')
)
INSERT INTO course_section (
    course_offering_id,
    sub_term_id,
    academic_division_id,
    section_letter,
    is_honors,
    is_lab,
    course_section_status_id,
    delivery_mode_id,
    grading_basis_id,
    credits,
    capacity,
    waitlist_allowed,
    start_date,
    end_date,
    notes
)
SELECT co.course_offering_id,
       sub_term.sub_term_id,
       division.academic_division_id,
       desired_sections.section_letter,
       desired_sections.is_honors,
       desired_sections.is_lab,
       status.course_section_status_id,
       delivery_mode.delivery_mode_id,
       grading_basis.grading_basis_id,
       desired_sections.credits,
       desired_sections.capacity,
       desired_sections.waitlist_allowed,
       desired_sections.start_date,
       desired_sections.end_date,
       desired_sections.notes
FROM desired_sections
JOIN academic_subject s ON s.code = desired_sections.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_sections.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_sections.version_number
JOIN academic_year ay ON ay.code = desired_sections.academic_year_code
JOIN course_offering co ON co.course_version_id = cv.course_version_id
                       AND co.academic_year_id = ay.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
                           AND sub_term.code = desired_sections.sub_term_code
JOIN academic_division division ON division.code = desired_sections.academic_division_code
JOIN course_section_status status ON status.code = desired_sections.status_code
JOIN delivery_mode ON delivery_mode.code = desired_sections.delivery_mode_code
JOIN grading_basis ON grading_basis.code = desired_sections.grading_basis_code
;

WITH desired_section_instructors(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    is_honors,
    is_lab,
    staff_email
) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'jane.smith@msm.edu'),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'B', TRUE, FALSE, 'alan.reed@msm.edu'),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SUMMER-I-2027', 'A', FALSE, FALSE, 'jane.smith@msm.edu'),
        ('TOLK', '240', 1, 'AY-2026-2027', 'FALL-2026', 'A', FALSE, FALSE, 'maria.chen@msm.edu'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'nadia.rivera@msm.edu'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, TRUE, 'nadia.rivera@msm.edu'),
        ('ELV', '201', 1, 'AY-2026-2027', 'SUMMER-II-2027', 'A', FALSE, FALSE, 'nadia.rivera@msm.edu'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-I-2027', 'A', FALSE, FALSE, 'alan.reed@msm.edu'),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-II-2027', 'A', FALSE, FALSE, 'alan.reed@msm.edu'),
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', FALSE, FALSE, 'maria.chen@msm.edu'),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, FALSE, 'maria.chen@msm.edu'),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'B', FALSE, FALSE, 'jane.smith@msm.edu')
)
INSERT INTO course_section_instructor (
    section_id,
    staff_id,
    section_instructor_role_id,
    is_primary
)
SELECT course_section.section_id,
       staff.id,
       role.section_instructor_role_id,
       TRUE
FROM desired_section_instructors
JOIN academic_subject s ON s.code = desired_section_instructors.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_section_instructors.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_section_instructors.version_number
JOIN academic_year ay ON ay.code = desired_section_instructors.academic_year_code
JOIN course_offering co ON co.course_version_id = cv.course_version_id
                       AND co.academic_year_id = ay.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
                           AND sub_term.code = desired_section_instructors.sub_term_code
JOIN course_section ON course_section.course_offering_id = co.course_offering_id
                   AND course_section.sub_term_id = sub_term.sub_term_id
                   AND course_section.section_letter = desired_section_instructors.section_letter
                   AND course_section.is_honors = desired_section_instructors.is_honors
                   AND course_section.is_lab = desired_section_instructors.is_lab
JOIN staff ON staff.email = desired_section_instructors.staff_email
JOIN section_instructor_role role ON role.code = 'PRIMARY'
;

WITH desired_section_meetings(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    is_honors,
    is_lab,
    meeting_type_code,
    day_of_week,
    start_time,
    end_time,
    building,
    room,
    sequence_number
) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'CLASS', 1, '09:00'::time, '10:15'::time, 'Rivendell Hall', '204', 1),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'CLASS', 3, '09:00'::time, '10:15'::time, 'Rivendell Hall', '204', 2),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'B', TRUE, FALSE, 'CLASS', 2, '11:00'::time, '12:15'::time, 'Lore House', '012', 1),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'B', TRUE, FALSE, 'CLASS', 4, '13:00'::time, '14:15'::time, 'Lore House', '012', 2),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SUMMER-I-2027', 'A', FALSE, FALSE, 'CLASS', NULL, NULL, NULL, NULL, NULL, 1),
        ('TOLK', '240', 1, 'AY-2026-2027', 'FALL-2026', 'A', FALSE, FALSE, 'CLASS', 5, '13:00'::time, '15:30'::time, 'Rivendell Hall', '110', 1),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'CLASS', 1, '10:30'::time, '11:45'::time, 'Language Hall', '201', 1),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, FALSE, 'CLASS', 3, '10:30'::time, '11:45'::time, 'Language Hall', '201', 2),
        ('ELV', '201', 1, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, TRUE, 'LAB', 4, '14:00'::time, '15:30'::time, 'Language Hall', '210', 1),
        ('ELV', '201', 1, 'AY-2026-2027', 'SUMMER-II-2027', 'A', FALSE, FALSE, 'CLASS', NULL, NULL, NULL, NULL, NULL, 1),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-I-2027', 'A', FALSE, FALSE, 'CLASS', 2, '09:00'::time, '10:00'::time, 'Rivendell Hall', 'Faculty Suite', 1),
        ('TOLK', '480', 1, 'AY-2026-2027', 'SUMMER-II-2027', 'A', FALSE, FALSE, 'CLASS', 2, '09:00'::time, '10:00'::time, 'Rivendell Hall', 'Faculty Suite', 1),
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', FALSE, FALSE, 'CLASS', 2, '09:30'::time, '10:45'::time, 'History Hall', '301', 1),
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', FALSE, FALSE, 'CLASS', 4, '09:30'::time, '10:45'::time, 'History Hall', '301', 2),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, FALSE, 'CLASS', 1, '08:00'::time, '09:15'::time, 'History Hall', '302', 1),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, FALSE, 'CLASS', 3, '08:00'::time, '09:15'::time, 'History Hall', '302', 2),
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'B', FALSE, FALSE, 'CLASS', 5, '12:30'::time, '15:30'::time, 'History Hall', '310', 1)
)
INSERT INTO course_section_meeting (
    section_id,
    section_meeting_type_id,
    day_of_week,
    start_time,
    end_time,
    building,
    room,
    sequence_number
)
SELECT course_section.section_id,
       meeting_type.section_meeting_type_id,
       desired_section_meetings.day_of_week,
       desired_section_meetings.start_time,
       desired_section_meetings.end_time,
       desired_section_meetings.building,
       desired_section_meetings.room,
       desired_section_meetings.sequence_number
FROM desired_section_meetings
JOIN academic_subject s ON s.code = desired_section_meetings.subject_code
JOIN course c ON c.subject_id = s.subject_id
             AND c.course_number = desired_section_meetings.course_number
JOIN course_version cv ON cv.course_id = c.course_id
                      AND cv.version_number = desired_section_meetings.version_number
JOIN academic_year ay ON ay.code = desired_section_meetings.academic_year_code
JOIN course_offering co ON co.course_version_id = cv.course_version_id
                       AND co.academic_year_id = ay.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = ay.academic_year_id
                           AND sub_term.code = desired_section_meetings.sub_term_code
JOIN course_section ON course_section.course_offering_id = co.course_offering_id
                   AND course_section.sub_term_id = sub_term.sub_term_id
                   AND course_section.section_letter = desired_section_meetings.section_letter
                   AND course_section.is_honors = desired_section_meetings.is_honors
                   AND course_section.is_lab = desired_section_meetings.is_lab
JOIN section_meeting_type meeting_type ON meeting_type.code = desired_section_meetings.meeting_type_code
;
