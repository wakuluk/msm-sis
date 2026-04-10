-- Tolkien-themed catalog seed data for local development and manual testing.
-- This script is written to be rerunnable without duplicating rows.

INSERT INTO academic_department (code, name, active)
SELECT 'HUM', 'Humanities', TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM academic_department
    WHERE code = 'HUM'
);

INSERT INTO academic_department (code, name, active)
SELECT 'LANG', 'Languages', TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM academic_department
    WHERE code = 'LANG'
);

INSERT INTO academic_department (code, name, active)
SELECT 'HIST', 'History', TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM academic_department
    WHERE code = 'HIST'
);

INSERT INTO catalog_subject (department_id, code, name, active)
SELECT d.department_id, 'TOLK', 'Tolkien Studies', TRUE
FROM academic_department d
WHERE d.code = 'HUM'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_subject
      WHERE code = 'TOLK'
  );

INSERT INTO catalog_subject (department_id, code, name, active)
SELECT d.department_id, 'ELV', 'Elvish Languages', TRUE
FROM academic_department d
WHERE d.code = 'LANG'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_subject
      WHERE code = 'ELV'
  );

INSERT INTO catalog_subject (department_id, code, name, active)
SELECT d.department_id, 'MEH', 'Middle-earth History', TRUE
FROM academic_department d
WHERE d.code = 'HIST'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_subject
      WHERE code = 'MEH'
  );

INSERT INTO catalog_academic_year (code, name, start_date, end_date, active)
SELECT 'AY-2026-2027', 'Academic Year 2026-2027', '2026-08-01', '2027-05-31', TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM catalog_academic_year
    WHERE code = 'AY-2026-2027'
);

INSERT INTO catalog_academic_year (code, name, start_date, end_date, active)
SELECT 'AY-2027-2028', 'Academic Year 2027-2028', '2027-08-01', '2028-05-31', TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM catalog_academic_year
    WHERE code = 'AY-2027-2028'
);

INSERT INTO catalog_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'FALL-2026', 'Fall 2026', '2026-08-24', '2026-12-11', 202630, ts.term_status_id, TRUE
FROM catalog_term_status ts
JOIN catalog_academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'REGISTRATION_OPEN'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_term
      WHERE code = 'FALL-2026'
  );

INSERT INTO catalog_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'SPRING-2027', 'Spring 2027', '2027-01-19', '2027-05-07', 202710, ts.term_status_id, TRUE
FROM catalog_term_status ts
JOIN catalog_academic_year ay ON ay.code = 'AY-2026-2027'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_term
      WHERE code = 'SPRING-2027'
  );

INSERT INTO catalog_term (academic_year_id, code, name, start_date, end_date, sort_order, term_status_id, active)
SELECT ay.academic_year_id, 'FALL-2027', 'Fall 2027', '2027-08-23', '2027-12-10', 202730, ts.term_status_id, TRUE
FROM catalog_term_status ts
JOIN catalog_academic_year ay ON ay.code = 'AY-2027-2028'
WHERE ts.code = 'PLANNED'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_term
      WHERE code = 'FALL-2027'
  );

INSERT INTO catalog_course (subject_id, course_number, active)
SELECT s.subject_id, '101', TRUE
FROM catalog_subject s
WHERE s.code = 'TOLK'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '101'
  );

INSERT INTO catalog_course (subject_id, course_number, active)
SELECT s.subject_id, '240', TRUE
FROM catalog_subject s
WHERE s.code = 'TOLK'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '240'
  );

INSERT INTO catalog_course (subject_id, course_number, active)
SELECT s.subject_id, '201', TRUE
FROM catalog_subject s
WHERE s.code = 'ELV'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '201'
  );

INSERT INTO catalog_course (subject_id, course_number, active)
SELECT s.subject_id, '310', TRUE
FROM catalog_subject s
WHERE s.code = 'MEH'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '310'
  );

INSERT INTO catalog_course (subject_id, course_number, active)
SELECT s.subject_id, '480', TRUE
FROM catalog_subject s
WHERE s.code = 'TOLK'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course c
      WHERE c.subject_id = s.subject_id
        AND c.course_number = '480'
  );

INSERT INTO catalog_course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    active,
    is_default
)
SELECT c.course_id,
       1,
       'Introduction to Tolkien Studies',
       'An introduction to Tolkien''s legendarium, major themes, and the relationship between The Hobbit, The Lord of the Rings, and The Silmarillion.',
       3.00,
       3.00,
       FALSE,
       TRUE,
       TRUE
FROM catalog_course c
JOIN catalog_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '101'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO catalog_course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    active,
    is_default
)
SELECT c.course_id,
       2,
       'Introduction to Tolkien Studies: Texts and Adaptations',
       'A revised survey of Tolkien studies with expanded attention to adaptation, reception, and the cultural afterlife of Middle-earth.',
       3.00,
       3.00,
       FALSE,
       TRUE,
       FALSE
FROM catalog_course c
JOIN catalog_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '101'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 2
  );

INSERT INTO catalog_course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    active,
    is_default
)
SELECT c.course_id,
       1,
       'The Fellowship and the Heroic Quest',
       'A close reading of The Fellowship of the Ring with emphasis on quest structure, friendship, and the moral imagination.',
       3.00,
       3.00,
       FALSE,
       TRUE,
       TRUE
FROM catalog_course c
JOIN catalog_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '240'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO catalog_course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    active,
    is_default
)
SELECT c.course_id,
       1,
       'Sindarin and Quenya Foundations',
       'An introductory study of Tolkien''s Elvish languages, including phonology, writing systems, and selected translated passages.',
       4.00,
       4.00,
       FALSE,
       TRUE,
       TRUE
FROM catalog_course c
JOIN catalog_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'ELV'
  AND c.course_number = '201'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO catalog_course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    active,
    is_default
)
SELECT c.course_id,
       1,
       'Kingship and Stewardship in Middle-earth',
       'A historical and political reading of rulership, succession, and legitimacy from Numenor to Gondor.',
       3.00,
       3.00,
       FALSE,
       TRUE,
       TRUE
FROM catalog_course c
JOIN catalog_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'MEH'
  AND c.course_number = '310'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO catalog_course_version (
    course_id,
    version_number,
    title,
    catalog_description,
    min_credits,
    max_credits,
    is_variable_credit,
    active,
    is_default
)
SELECT c.course_id,
       1,
       'Independent Study in Middle-earth Cartography',
       'Supervised work on maps, movement, and spatial storytelling across Tolkien''s secondary world.',
       1.00,
       3.00,
       TRUE,
       TRUE,
       TRUE
FROM catalog_course c
JOIN catalog_subject s ON s.subject_id = c.subject_id
WHERE s.code = 'TOLK'
  AND c.course_number = '480'
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_version cv
      WHERE cv.course_id = c.course_id
        AND cv.version_number = 1
  );

INSERT INTO catalog_course_offering (
    course_version_id,
    term_id,
    course_offering_status_id,
    notes
)
SELECT cv.course_version_id,
       t.term_id,
       cos.course_offering_status_id,
       'Featured in the Great Books cluster.'
FROM catalog_course_version cv
JOIN catalog_course c ON c.course_id = cv.course_id
JOIN catalog_subject s ON s.subject_id = c.subject_id
JOIN catalog_term t ON t.code = 'FALL-2026'
JOIN catalog_course_offering_status cos ON cos.code = 'OPEN_FOR_REGISTRATION'
WHERE s.code = 'TOLK'
  AND c.course_number = '101'
  AND cv.version_number = 1
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_offering co
      WHERE co.course_version_id = cv.course_version_id
        AND co.term_id = t.term_id
  );

INSERT INTO catalog_course_offering (
    course_version_id,
    term_id,
    course_offering_status_id,
    notes
)
SELECT cv.course_version_id,
       t.term_id,
       cos.course_offering_status_id,
       'Includes a weekend film-comparison workshop.'
FROM catalog_course_version cv
JOIN catalog_course c ON c.course_id = cv.course_id
JOIN catalog_subject s ON s.subject_id = c.subject_id
JOIN catalog_term t ON t.code = 'SPRING-2027'
JOIN catalog_course_offering_status cos ON cos.code = 'OPEN_FOR_DISPLAY'
WHERE s.code = 'TOLK'
  AND c.course_number = '101'
  AND cv.version_number = 2
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_offering co
      WHERE co.course_version_id = cv.course_version_id
        AND co.term_id = t.term_id
  );

INSERT INTO catalog_course_offering (
    course_version_id,
    term_id,
    course_offering_status_id,
    notes
)
SELECT cv.course_version_id,
       t.term_id,
       cos.course_offering_status_id,
       'Seminar format with weekly textual analysis.'
FROM catalog_course_version cv
JOIN catalog_course c ON c.course_id = cv.course_id
JOIN catalog_subject s ON s.subject_id = c.subject_id
JOIN catalog_term t ON t.code = 'FALL-2026'
JOIN catalog_course_offering_status cos ON cos.code = 'OPEN_FOR_DISPLAY'
WHERE s.code = 'TOLK'
  AND c.course_number = '240'
  AND cv.version_number = 1
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_offering co
      WHERE co.course_version_id = cv.course_version_id
        AND co.term_id = t.term_id
  );

INSERT INTO catalog_course_offering (
    course_version_id,
    term_id,
    course_offering_status_id,
    notes
)
SELECT cv.course_version_id,
       t.term_id,
       cos.course_offering_status_id,
       'Cross-listed with linguistics discussion groups.'
FROM catalog_course_version cv
JOIN catalog_course c ON c.course_id = cv.course_id
JOIN catalog_subject s ON s.subject_id = c.subject_id
JOIN catalog_term t ON t.code = 'SPRING-2027'
JOIN catalog_course_offering_status cos ON cos.code = 'PLANNED'
WHERE s.code = 'ELV'
  AND c.course_number = '201'
  AND cv.version_number = 1
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_offering co
      WHERE co.course_version_id = cv.course_version_id
        AND co.term_id = t.term_id
  );

INSERT INTO catalog_course_offering (
    course_version_id,
    term_id,
    course_offering_status_id,
    notes
)
SELECT cv.course_version_id,
       t.term_id,
       cos.course_offering_status_id,
       'Focuses on Gondor, Arnor, and the long defeat.'
FROM catalog_course_version cv
JOIN catalog_course c ON c.course_id = cv.course_id
JOIN catalog_subject s ON s.subject_id = c.subject_id
JOIN catalog_term t ON t.code = 'FALL-2027'
JOIN catalog_course_offering_status cos ON cos.code = 'PLANNED'
WHERE s.code = 'MEH'
  AND c.course_number = '310'
  AND cv.version_number = 1
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_offering co
      WHERE co.course_version_id = cv.course_version_id
        AND co.term_id = t.term_id
  );

INSERT INTO catalog_course_offering (
    course_version_id,
    term_id,
    course_offering_status_id,
    notes
)
SELECT cv.course_version_id,
       t.term_id,
       cos.course_offering_status_id,
       'Independent projects require faculty approval.'
FROM catalog_course_version cv
JOIN catalog_course c ON c.course_id = cv.course_id
JOIN catalog_subject s ON s.subject_id = c.subject_id
JOIN catalog_term t ON t.code = 'SPRING-2027'
JOIN catalog_course_offering_status cos ON cos.code = 'OPEN_FOR_DISPLAY'
WHERE s.code = 'TOLK'
  AND c.course_number = '480'
  AND cv.version_number = 1
  AND NOT EXISTS (
      SELECT 1
      FROM catalog_course_offering co
      WHERE co.course_version_id = cv.course_version_id
        AND co.term_id = t.term_id
  );
