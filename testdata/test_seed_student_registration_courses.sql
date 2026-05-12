-- Student course registration test data for Samwise.
-- This keeps registration-specific cases separate from the broader course/catalog seed.

INSERT INTO student_section_enrollment_status (code, name, sort_order, allow_linear_shift)
VALUES ('IN_PROGRESS', 'In progress', 4, TRUE)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    allow_linear_shift = EXCLUDED.allow_linear_shift;

INSERT INTO academic_year (code, name, start_date, end_date, active, is_published, year_status_id)
SELECT 'AY-2025-2026',
       'Academic Year 2025-2026',
       '2025-08-01'::date,
       '2026-08-15'::date,
       TRUE,
       TRUE,
       status.year_status_id
FROM academic_year_status status
WHERE status.code = 'ACTIVE'
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    active = EXCLUDED.active,
    is_published = EXCLUDED.is_published,
    year_status_id = EXCLUDED.year_status_id;

WITH desired_sub_terms(code, name, start_date, end_date, sort_order, status_code) AS (
    VALUES
        ('FALL-2025', 'Fall 2025', '2025-08-25'::date, '2025-12-12'::date, 202530, 'COMPLETED'),
        ('SPRING-2026', 'Spring 2026', '2026-01-20'::date, '2026-06-05'::date, 202610, 'ACTIVE')
)
INSERT INTO academic_sub_term (
    academic_year_id,
    code,
    name,
    start_date,
    end_date,
    sort_order,
    sub_term_status_id,
    active
)
SELECT year.academic_year_id,
       desired_sub_terms.code,
       desired_sub_terms.name,
       desired_sub_terms.start_date,
       desired_sub_terms.end_date,
       desired_sub_terms.sort_order,
       status.sub_term_status_id,
       TRUE
FROM desired_sub_terms
JOIN academic_year year ON year.code = 'AY-2025-2026'
JOIN academic_sub_term_status status ON status.code = desired_sub_terms.status_code
ON CONFLICT ON CONSTRAINT uq_academic_sub_term_year_code DO UPDATE
SET name = EXCLUDED.name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    sort_order = EXCLUDED.sort_order,
    sub_term_status_id = EXCLUDED.sub_term_status_id,
    active = EXCLUDED.active;

WITH desired_terms(code, name, start_date, end_date) AS (
    VALUES
        ('FALL-2025-2026', 'Fall 2025-2026', '2025-08-25'::date, '2025-12-12'::date),
        ('SPRING-2025-2026', 'Spring 2025-2026', '2026-01-20'::date, '2026-06-05'::date)
)
INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT year.academic_year_id,
       desired_terms.code,
       desired_terms.name,
       desired_terms.start_date,
       desired_terms.end_date
FROM desired_terms
JOIN academic_year year ON year.code = 'AY-2025-2026'
ON CONFLICT ON CONSTRAINT uq_academic_term_year_code DO UPDATE
SET name = EXCLUDED.name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id,
       sub_term.sub_term_id
FROM academic_term term
JOIN academic_year year ON year.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
WHERE year.code = 'AY-2025-2026'
  AND (
      (term.code = 'FALL-2025-2026' AND sub_term.code = 'FALL-2025')
      OR (term.code = 'SPRING-2025-2026' AND sub_term.code = 'SPRING-2026')
  )
ON CONFLICT DO NOTHING;

-- Fall 2027 should be visible to the student registration search once a student
-- is assigned to that term's registration group.
UPDATE academic_sub_term sub_term
SET sub_term_status_id = status.sub_term_status_id,
    active = TRUE
FROM academic_sub_term_status status
JOIN academic_year year ON year.code = 'AY-2027-2028'
WHERE status.code = 'OPEN_FOR_REGISTRATION'
  AND sub_term.academic_year_id = year.academic_year_id
  AND sub_term.code = 'FALL-2027';

WITH desired_sub_terms(code, name, start_date, end_date, sort_order, status_code) AS (
    VALUES
        ('FALL-A-2026', 'Fall 2026 Session A', '2026-08-24'::date, '2026-10-16'::date, 202631, 'OPEN_FOR_REGISTRATION'),
        ('FALL-B-2026', 'Fall 2026 Session B', '2026-10-19'::date, '2026-12-11'::date, 202632, 'OPEN_FOR_REGISTRATION')
)
INSERT INTO academic_sub_term (
    academic_year_id,
    code,
    name,
    start_date,
    end_date,
    sort_order,
    sub_term_status_id,
    active
)
SELECT year.academic_year_id,
       desired_sub_terms.code,
       desired_sub_terms.name,
       desired_sub_terms.start_date,
       desired_sub_terms.end_date,
       desired_sub_terms.sort_order,
       status.sub_term_status_id,
       TRUE
FROM desired_sub_terms
JOIN academic_year year ON year.code = 'AY-2026-2027'
JOIN academic_sub_term_status status ON status.code = desired_sub_terms.status_code
ON CONFLICT ON CONSTRAINT uq_academic_sub_term_year_code DO UPDATE
SET name = EXCLUDED.name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    sort_order = EXCLUDED.sort_order,
    sub_term_status_id = EXCLUDED.sub_term_status_id,
    active = EXCLUDED.active;

INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id,
       sub_term.sub_term_id
FROM academic_term term
JOIN academic_year year ON year.academic_year_id = term.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
WHERE year.code = 'AY-2026-2027'
  AND term.code = 'FALL-2026-2027'
  AND sub_term.code IN ('FALL-A-2026', 'FALL-B-2026')
ON CONFLICT DO NOTHING;

DELETE FROM course_section section
USING course_offering offering,
      course_version version,
      course,
      academic_subject subject,
      academic_year year,
      academic_sub_term sub_term
WHERE section.course_offering_id = offering.course_offering_id
  AND section.sub_term_id = sub_term.sub_term_id
  AND offering.course_version_id = version.course_version_id
  AND offering.academic_year_id = year.academic_year_id
  AND version.course_id = course.course_id
  AND course.subject_id = subject.subject_id
  AND subject.code = 'TOLK'
  AND course.course_number IN ('264', '265', '266')
  AND year.code = 'AY-2027-2028'
  AND sub_term.code IN ('FALL-A-2027', 'FALL-B-2027');

DELETE FROM course_offering_sub_term offering_sub_term
USING course_offering offering,
      course_version version,
      course,
      academic_subject subject,
      academic_year year,
      academic_sub_term sub_term
WHERE offering_sub_term.course_offering_id = offering.course_offering_id
  AND offering_sub_term.sub_term_id = sub_term.sub_term_id
  AND offering.course_version_id = version.course_version_id
  AND offering.academic_year_id = year.academic_year_id
  AND version.course_id = course.course_id
  AND course.subject_id = subject.subject_id
  AND subject.code = 'TOLK'
  AND course.course_number IN ('264', '265', '266')
  AND year.code = 'AY-2027-2028'
  AND sub_term.code IN ('FALL-A-2027', 'FALL-B-2027');

DELETE FROM course_offering offering
USING course_version version,
      course,
      academic_subject subject,
      academic_year year
WHERE offering.course_version_id = version.course_version_id
  AND offering.academic_year_id = year.academic_year_id
  AND version.course_id = course.course_id
  AND course.subject_id = subject.subject_id
  AND subject.code = 'TOLK'
  AND course.course_number IN ('264', '265', '266')
  AND year.code = 'AY-2027-2028';

DELETE FROM course_section section
USING course_offering offering,
      course_version version,
      course,
      academic_subject subject,
      academic_year year,
      academic_sub_term sub_term
WHERE section.course_offering_id = offering.course_offering_id
  AND section.sub_term_id = sub_term.sub_term_id
  AND offering.course_version_id = version.course_version_id
  AND offering.academic_year_id = year.academic_year_id
  AND version.course_id = course.course_id
  AND course.subject_id = subject.subject_id
  AND subject.code = 'TOLK'
  AND course.course_number IN ('264', '265', '266')
  AND year.code = 'AY-2026-2027'
  AND sub_term.code IN ('FALL-A-2026', 'FALL-B-2026')
  AND NOT (
      (course.course_number = '264' AND sub_term.code = 'FALL-A-2026' AND section.section_letter = 'A')
      OR (course.course_number = '265' AND sub_term.code = 'FALL-A-2026' AND section.section_letter = 'A')
      OR (course.course_number = '265' AND sub_term.code = 'FALL-B-2026' AND section.section_letter = 'B')
      OR (course.course_number = '266' AND sub_term.code = 'FALL-B-2026' AND section.section_letter = 'A')
  );

INSERT INTO course (subject_id, course_number, is_lab, active)
SELECT subject.subject_id, '263', FALSE, TRUE
FROM academic_subject subject
WHERE subject.code = 'TOLK'
ON CONFLICT ON CONSTRAINT uq_course_subject_number DO UPDATE
SET is_lab = FALSE,
    active = TRUE;

WITH desired_courses(course_number) AS (
    VALUES
        ('264'),
        ('265'),
        ('266'),
        ('270'),
        ('271'),
        ('272'),
        ('273'),
        ('274'),
        ('275'),
        ('276'),
        ('277')
)
INSERT INTO course (subject_id, course_number, is_lab, active)
SELECT subject.subject_id,
       desired_courses.course_number,
       FALSE,
       TRUE
FROM desired_courses
JOIN academic_subject subject ON subject.code = 'TOLK'
ON CONFLICT ON CONSTRAINT uq_course_subject_number DO UPDATE
SET is_lab = FALSE,
    active = TRUE;

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
SELECT course.course_id,
       1,
       'Local Credit Prerequisite Practicum',
       'A seeded registration course used to verify a prerequisite satisfied by a completed local course.',
       3.00,
       3.00,
       FALSE,
       TRUE
FROM course
JOIN academic_subject subject ON subject.subject_id = course.subject_id
WHERE subject.code = 'TOLK'
  AND course.course_number = '263'
ON CONFLICT ON CONSTRAINT uq_course_version_course_version DO UPDATE
SET title = EXCLUDED.title,
    catalog_description = EXCLUDED.catalog_description,
    min_credits = EXCLUDED.min_credits,
    max_credits = EXCLUDED.max_credits,
    is_variable_credit = EXCLUDED.is_variable_credit,
    is_current = EXCLUDED.is_current;

WITH desired_versions(course_number, title, catalog_description) AS (
    VALUES
        ('264', 'Session Overlap Seminar', 'A seeded Session A course used to verify overlap with full-term MWF 9:00 sections.'),
        ('265', 'Session A Non-Overlap Test', 'A seeded Session A course used to verify same-time Session B courses do not conflict.'),
        ('266', 'Session B Non-Overlap Test', 'A seeded Session B course used to verify same-time Session A courses do not conflict.'),
        ('270', 'Failed Prerequisite Source', 'A seeded completed transcript course where Sam earned an F.'),
        ('271', 'Low Grade Prerequisite Source', 'A seeded completed transcript course where Sam passed below a B minimum grade.'),
        ('272', 'High Grade Prerequisite Source', 'A seeded completed transcript course where Sam passed above a B minimum grade.'),
        ('273', 'No Minimum Grade Prerequisite Target', 'A seeded Fall 2026 registration target blocked by Sam failing TOLK 270.'),
        ('274', 'Minimum Grade Too Low Target', 'A seeded Fall 2026 registration target blocked by Sam earning below the required B in TOLK 271.'),
        ('275', 'Minimum Grade Satisfied Target', 'A seeded Fall 2026 registration target satisfied by Sam earning above the required B in TOLK 272.'),
        ('276', 'In-Progress Prerequisite Source', 'A seeded Spring 2026 in-progress transcript course for Sam with no posted grade.'),
        ('277', 'In-Progress Prerequisite Target', 'A seeded Fall 2026 registration target satisfied by Sam currently taking TOLK 276.')
)
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
SELECT course.course_id,
       1,
       desired_versions.title,
       desired_versions.catalog_description,
       3.00,
       3.00,
       FALSE,
       TRUE
FROM desired_versions
JOIN academic_subject subject ON subject.code = 'TOLK'
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_versions.course_number
ON CONFLICT ON CONSTRAINT uq_course_version_course_version DO UPDATE
SET title = EXCLUDED.title,
    catalog_description = EXCLUDED.catalog_description,
    min_credits = EXCLUDED.min_credits,
    max_credits = EXCLUDED.max_credits,
    is_variable_credit = EXCLUDED.is_variable_credit,
    is_current = EXCLUDED.is_current;

WITH desired_requisite_groups(
    target_subject_code,
    target_course_number,
    target_version_number,
    requisite_type,
    condition_type,
    minimum_required,
    sort_order
) AS (
    VALUES
        ('TOLK', '263', 1, 'PREREQUISITE', 'ALL', NULL::int, 1),
        ('TOLK', '266', 1, 'PREREQUISITE', 'ALL', NULL::int, 1),
        ('TOLK', '273', 1, 'PREREQUISITE', 'ALL', NULL::int, 1),
        ('TOLK', '274', 1, 'PREREQUISITE', 'ALL', NULL::int, 1),
        ('TOLK', '275', 1, 'PREREQUISITE', 'ALL', NULL::int, 1),
        ('TOLK', '277', 1, 'PREREQUISITE', 'ALL', NULL::int, 1)
)
INSERT INTO course_version_requisite_group (
    course_version_id,
    requisite_type,
    condition_type,
    minimum_required,
    sort_order
)
SELECT target_version.course_version_id,
       desired_requisite_groups.requisite_type,
       desired_requisite_groups.condition_type,
       desired_requisite_groups.minimum_required,
       desired_requisite_groups.sort_order
FROM desired_requisite_groups
JOIN academic_subject target_subject
    ON target_subject.code = desired_requisite_groups.target_subject_code
JOIN course target_course
    ON target_course.subject_id = target_subject.subject_id
   AND target_course.course_number = desired_requisite_groups.target_course_number
JOIN course_version target_version
    ON target_version.course_id = target_course.course_id
   AND target_version.version_number = desired_requisite_groups.target_version_number
WHERE NOT EXISTS (
    SELECT 1
    FROM course_version_requisite_group existing_group
    WHERE existing_group.course_version_id = target_version.course_version_id
      AND existing_group.requisite_type = desired_requisite_groups.requisite_type
      AND existing_group.condition_type = desired_requisite_groups.condition_type
      AND COALESCE(existing_group.minimum_required, -1) = COALESCE(desired_requisite_groups.minimum_required, -1)
      AND existing_group.sort_order = desired_requisite_groups.sort_order
);

WITH desired_requisite_courses(
    target_subject_code,
    target_course_number,
    target_version_number,
    requisite_type,
    condition_type,
    group_sort_order,
    required_subject_code,
    required_course_number,
    minimum_grade,
    sort_order
) AS (
    VALUES
        ('TOLK', '263', 1, 'PREREQUISITE', 'ALL', 1, 'ELV', '201', NULL::varchar, 1),
        ('TOLK', '266', 1, 'PREREQUISITE', 'ALL', 1, 'TOLK', '265', NULL::varchar, 1),
        ('TOLK', '273', 1, 'PREREQUISITE', 'ALL', 1, 'TOLK', '270', NULL::varchar, 1),
        ('TOLK', '274', 1, 'PREREQUISITE', 'ALL', 1, 'TOLK', '271', 'B', 1),
        ('TOLK', '275', 1, 'PREREQUISITE', 'ALL', 1, 'TOLK', '272', 'B', 1),
        ('TOLK', '277', 1, 'PREREQUISITE', 'ALL', 1, 'TOLK', '276', 'B', 1)
)
INSERT INTO course_version_requisite_course (
    course_version_requisite_group_id,
    course_id,
    minimum_grade,
    sort_order
)
SELECT requisite_group.course_version_requisite_group_id,
       required_course.course_id,
       desired_requisite_courses.minimum_grade,
       desired_requisite_courses.sort_order
FROM desired_requisite_courses
JOIN academic_subject target_subject
    ON target_subject.code = desired_requisite_courses.target_subject_code
JOIN course target_course
    ON target_course.subject_id = target_subject.subject_id
   AND target_course.course_number = desired_requisite_courses.target_course_number
JOIN course_version target_version
    ON target_version.course_id = target_course.course_id
   AND target_version.version_number = desired_requisite_courses.target_version_number
JOIN course_version_requisite_group requisite_group
    ON requisite_group.course_version_id = target_version.course_version_id
   AND requisite_group.requisite_type = desired_requisite_courses.requisite_type
   AND requisite_group.condition_type = desired_requisite_courses.condition_type
   AND requisite_group.sort_order = desired_requisite_courses.group_sort_order
JOIN academic_subject required_subject
    ON required_subject.code = desired_requisite_courses.required_subject_code
JOIN course required_course
    ON required_course.subject_id = required_subject.subject_id
   AND required_course.course_number = desired_requisite_courses.required_course_number
ON CONFLICT ON CONSTRAINT uq_course_version_requisite_course DO UPDATE
SET minimum_grade = EXCLUDED.minimum_grade,
    sort_order = EXCLUDED.sort_order;

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code, notes) AS (
    VALUES
        ('TOLK', '260', 1, 'AY-2026-2027', 'Registration test: Sam has transfer credit for TOLK 101.'),
        ('TOLK', '260', 1, 'AY-2027-2028', 'Registration test: Sam has transfer credit for TOLK 101.'),
        ('TOLK', '261', 1, 'AY-2026-2027', 'Registration test: corequisite lecture.'),
        ('TOLK', '261', 1, 'AY-2027-2028', 'Registration test: corequisite lecture.'),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'Registration test: corequisite lab.'),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'Registration test: corequisite lab.'),
        ('TOLK', '262', 1, 'AY-2026-2027', 'Registration test: Sam is missing TOLK 240.'),
        ('TOLK', '262', 1, 'AY-2027-2028', 'Registration test: Sam is missing TOLK 240.'),
        ('TOLK', '263', 1, 'AY-2026-2027', 'Registration test: Sam completed local ELV 201.'),
        ('TOLK', '263', 1, 'AY-2027-2028', 'Registration test: Sam completed local ELV 201.'),
        ('TOLK', '264', 1, 'AY-2026-2027', 'Registration test: Session A course overlapping full-term MWF 9:00.'),
        ('TOLK', '265', 1, 'AY-2026-2027', 'Registration test: Session A same-time non-overlap pair.'),
        ('TOLK', '266', 1, 'AY-2026-2027', 'Registration test: Session B same-time non-overlap pair.'),
        ('TOLK', '270', 1, 'AY-2025-2026', 'Registration minimum-grade POC: Fall 2025 failed source transcript course.'),
        ('TOLK', '271', 1, 'AY-2025-2026', 'Registration minimum-grade POC: Fall 2025 low-grade source transcript course.'),
        ('TOLK', '272', 1, 'AY-2025-2026', 'Registration minimum-grade POC: Fall 2025 high-grade source transcript course.'),
        ('TOLK', '276', 1, 'AY-2025-2026', 'Registration prerequisite POC: Spring 2026 in-progress source course.'),
        ('TOLK', '273', 1, 'AY-2026-2027', 'Registration minimum-grade POC: target with no minimum grade and a failed prerequisite.'),
        ('TOLK', '274', 1, 'AY-2026-2027', 'Registration minimum-grade POC: target with B minimum not met.'),
        ('TOLK', '275', 1, 'AY-2026-2027', 'Registration minimum-grade POC: target with B minimum met.'),
        ('TOLK', '277', 1, 'AY-2026-2027', 'Registration prerequisite POC: target satisfied by current in-progress course.')
)
INSERT INTO course_offering (
    course_version_id,
    academic_year_id,
    notes
)
SELECT version.course_version_id,
       year.academic_year_id,
       desired_offerings.notes
FROM desired_offerings
JOIN academic_subject subject ON subject.code = desired_offerings.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_offerings.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = desired_offerings.version_number
JOIN academic_year year ON year.code = desired_offerings.academic_year_code
ON CONFLICT ON CONSTRAINT uq_course_offering_version_year DO UPDATE
SET notes = EXCLUDED.notes;

WITH desired_offering_sub_terms(subject_code, course_number, version_number, academic_year_code, sub_term_code) AS (
    VALUES
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027'),
        ('TOLK', '261', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '261', 1, 'AY-2027-2028', 'FALL-2027'),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'FALL-2027'),
        ('TOLK', '262', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '262', 1, 'AY-2027-2028', 'FALL-2027'),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027'),
        ('TOLK', '264', 1, 'AY-2026-2027', 'FALL-A-2026'),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-A-2026'),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-B-2026'),
        ('TOLK', '266', 1, 'AY-2026-2027', 'FALL-B-2026'),
        ('TOLK', '270', 1, 'AY-2025-2026', 'FALL-2025'),
        ('TOLK', '271', 1, 'AY-2025-2026', 'FALL-2025'),
        ('TOLK', '272', 1, 'AY-2025-2026', 'FALL-2025'),
        ('TOLK', '276', 1, 'AY-2025-2026', 'SPRING-2026'),
        ('TOLK', '273', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '274', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '275', 1, 'AY-2026-2027', 'FALL-2026'),
        ('TOLK', '277', 1, 'AY-2026-2027', 'FALL-2026')
)
INSERT INTO course_offering_sub_term (
    course_offering_id,
    sub_term_id,
    academic_year_id
)
SELECT offering.course_offering_id,
       sub_term.sub_term_id,
       year.academic_year_id
FROM desired_offering_sub_terms
JOIN academic_subject subject ON subject.code = desired_offering_sub_terms.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_offering_sub_terms.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = desired_offering_sub_terms.version_number
JOIN academic_year year ON year.code = desired_offering_sub_terms.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_offering_sub_terms.sub_term_code
ON CONFLICT DO NOTHING;

WITH desired_sections(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    delivery_mode_code,
    credits,
    capacity,
    hard_capacity,
    waitlist_allowed,
    start_date,
    end_date,
    notes
) AS (
    VALUES
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Transfer prereq test, overlapping section A.'),
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Transfer prereq test, overlapping section B.'),
        ('TOLK', '261', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Corequisite warning test, overlapping lecture A.'),
        ('TOLK', '261', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Corequisite warning test, overlapping lecture B.'),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 0.00, 20, 20, FALSE, '2026-08-24'::date, '2026-12-11'::date, 'Corequisite paired lab A.'),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'IN_PERSON', 0.00, 20, 20, FALSE, '2026-08-24'::date, '2026-12-11'::date, 'Corequisite paired lab B.'),
        ('TOLK', '262', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Missing prerequisite test: Sam lacks TOLK 240.'),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'HYBRID', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Local completed prereq test, overlapping section A.'),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'HYBRID', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Local completed prereq test, overlapping section B.'),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Transfer prereq test, overlapping section A.'),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'IN_PERSON', 3.00, 20, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Transfer prereq test, overlapping section B.'),
        ('TOLK', '261', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Corequisite warning test, overlapping lecture A.'),
        ('TOLK', '261', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'IN_PERSON', 3.00, 20, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Corequisite warning test, overlapping lecture B.'),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'IN_PERSON', 0.00, 20, 20, FALSE, '2027-08-23'::date, '2027-12-10'::date, 'Corequisite paired lab A.'),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'IN_PERSON', 0.00, 20, 20, FALSE, '2027-08-23'::date, '2027-12-10'::date, 'Corequisite paired lab B.'),
        ('TOLK', '262', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Missing prerequisite test: Sam lacks TOLK 240.'),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'HYBRID', 3.00, 20, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Local completed prereq test, overlapping section A.'),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'HYBRID', 3.00, 20, 24, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Local completed prereq test, overlapping section B.'),
        ('TOLK', '264', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-10-16'::date, 'Session A overlap test: same time as full-term MWF 9:00 sections.'),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-10-16'::date, 'Session A non-overlap test: same time as Session B TOLK 266.'),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-B-2026', 'B', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-10-19'::date, '2026-12-11'::date, 'Session B duplicate-course test: alternate section of Fall A TOLK 265.'),
        ('TOLK', '266', 1, 'AY-2026-2027', 'FALL-B-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-10-19'::date, '2026-12-11'::date, 'Session B non-overlap test: same time as Session A TOLK 265.'),
        ('TOLK', '270', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2025-08-25'::date, '2025-12-12'::date, 'Minimum-grade POC source: Sam failed this Fall 2025 transcript course.'),
        ('TOLK', '271', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2025-08-25'::date, '2025-12-12'::date, 'Minimum-grade POC source: Sam passed this Fall 2025 course below the B minimum.'),
        ('TOLK', '272', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2025-08-25'::date, '2025-12-12'::date, 'Minimum-grade POC source: Sam passed this Fall 2025 course above the B minimum.'),
        ('TOLK', '276', 1, 'AY-2025-2026', 'SPRING-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-01-20'::date, '2026-06-05'::date, 'Prerequisite POC source and Legolas grading demo: in-progress Spring 2026 course.'),
        ('TOLK', '273', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Minimum-grade POC target: no minimum grade, failed prerequisite.'),
        ('TOLK', '274', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Minimum-grade POC target: B minimum not met.'),
        ('TOLK', '275', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Minimum-grade POC target: B minimum met.'),
        ('TOLK', '277', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'IN_PERSON', 3.00, 20, 24, TRUE, '2026-08-24'::date, '2026-12-11'::date, 'Prerequisite POC target: current in-progress Spring 2026 prerequisite.')
)
INSERT INTO course_section (
    course_offering_id,
    sub_term_id,
    academic_division_id,
    section_letter,
    is_honors,
    course_section_status_id,
    delivery_mode_id,
    grading_basis_id,
    credits,
    capacity,
    hard_capacity,
    waitlist_allowed,
    start_date,
    end_date,
    notes
)
SELECT offering.course_offering_id,
       sub_term.sub_term_id,
       division.academic_division_id,
       desired_sections.section_letter,
       FALSE,
       status.course_section_status_id,
       delivery_mode.delivery_mode_id,
       grading_basis.grading_basis_id,
       desired_sections.credits,
       desired_sections.capacity,
       desired_sections.hard_capacity,
       desired_sections.waitlist_allowed,
       desired_sections.start_date,
       desired_sections.end_date,
       desired_sections.notes
FROM desired_sections
JOIN academic_subject subject ON subject.code = desired_sections.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_sections.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = desired_sections.version_number
JOIN academic_year year ON year.code = desired_sections.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_sections.sub_term_code
JOIN academic_division division ON division.code = 'UNDERGRADUATE'
JOIN course_section_status status ON status.code = 'PLANNED'
JOIN delivery_mode ON delivery_mode.code = desired_sections.delivery_mode_code
JOIN grading_basis ON grading_basis.code = 'GRADED'
ON CONFLICT ON CONSTRAINT uq_course_section_offering_sub_term_letter DO UPDATE
SET academic_division_id = EXCLUDED.academic_division_id,
    course_section_status_id = EXCLUDED.course_section_status_id,
    delivery_mode_id = EXCLUDED.delivery_mode_id,
    grading_basis_id = EXCLUDED.grading_basis_id,
    credits = EXCLUDED.credits,
    capacity = EXCLUDED.capacity,
    hard_capacity = EXCLUDED.hard_capacity,
    waitlist_allowed = EXCLUDED.waitlist_allowed,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    notes = EXCLUDED.notes;

UPDATE course_section section
SET course_section_status_id = status.course_section_status_id,
    updated_at = CURRENT_TIMESTAMP
FROM course_section_status status,
     course_offering offering,
     course_version version,
     course,
     academic_subject subject,
     academic_year year,
     academic_sub_term sub_term
WHERE status.code = 'IN_PROGRESS'
  AND section.course_offering_id = offering.course_offering_id
  AND section.sub_term_id = sub_term.sub_term_id
  AND offering.course_version_id = version.course_version_id
  AND offering.academic_year_id = year.academic_year_id
  AND version.course_id = course.course_id
  AND course.subject_id = subject.subject_id
  AND subject.code = 'TOLK'
  AND course.course_number = '276'
  AND version.version_number = 1
  AND year.code = 'AY-2025-2026'
  AND sub_term.code = 'SPRING-2026'
  AND section.section_letter = 'A'
  AND section.is_honors = FALSE;

WITH desired_instructors(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    staff_email
) AS (
    VALUES
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'nadia.rivera@msm.edu'),
        ('TOLK', '261', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '261', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'nadia.rivera@msm.edu'),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'alan.reed@msm.edu'),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'alan.reed@msm.edu'),
        ('TOLK', '262', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'maria.chen@msm.edu'),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'nadia.rivera@msm.edu'),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'nadia.rivera@msm.edu'),
        ('TOLK', '261', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '261', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'nadia.rivera@msm.edu'),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'alan.reed@msm.edu'),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'alan.reed@msm.edu'),
        ('TOLK', '262', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'maria.chen@msm.edu'),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'nadia.rivera@msm.edu'),
        ('TOLK', '264', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'nadia.rivera@msm.edu'),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-B-2026', 'B', 'nadia.rivera@msm.edu'),
        ('TOLK', '266', 1, 'AY-2026-2027', 'FALL-B-2026', 'A', 'nadia.rivera@msm.edu'),
        ('TOLK', '270', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'maria.chen@msm.edu'),
        ('TOLK', '271', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'maria.chen@msm.edu'),
        ('TOLK', '272', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'maria.chen@msm.edu'),
        ('TOLK', '276', 1, 'AY-2025-2026', 'SPRING-2026', 'A', 'legolas@mirkwood.me'),
        ('TOLK', '273', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'jane.smith@msm.edu'),
        ('TOLK', '274', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'nadia.rivera@msm.edu'),
        ('TOLK', '275', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'alan.reed@msm.edu'),
        ('TOLK', '277', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'jane.smith@msm.edu')
)
INSERT INTO course_section_instructor (
    section_id,
    instructor_user_id,
    instructional_assignment_role_id,
    can_view_grades,
    can_manage_grades,
    created_by_user_id,
    updated_by_user_id
)
SELECT section.section_id,
       staff.user_id,
       role.instructional_assignment_role_id,
       role.default_can_view_grades,
       role.default_can_manage_grades,
       actor.id,
       actor.id
FROM desired_instructors
JOIN academic_subject subject ON subject.code = desired_instructors.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_instructors.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = desired_instructors.version_number
JOIN academic_year year ON year.code = desired_instructors.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_instructors.sub_term_code
JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                           AND section.sub_term_id = sub_term.sub_term_id
                           AND section.section_letter = desired_instructors.section_letter
                           AND section.is_honors = FALSE
JOIN staff ON staff.email = desired_instructors.staff_email
JOIN instructional_assignment_role role ON role.code = 'PRIMARY_INSTRUCTOR'
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
ON CONFLICT ON CONSTRAINT uq_course_section_instructor_unique DO UPDATE
SET instructional_assignment_role_id = EXCLUDED.instructional_assignment_role_id,
    can_view_grades = EXCLUDED.can_view_grades,
    can_manage_grades = EXCLUDED.can_manage_grades,
    updated_by_user_id = EXCLUDED.updated_by_user_id;

WITH desired_meetings(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    meeting_type_code,
    day_of_week,
    start_time,
    end_time,
    building,
    room,
    sequence_number
) AS (
    VALUES
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 1, '09:00'::time, '09:50'::time, 'Rivendell Hall', '220', 1),
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 3, '09:00'::time, '09:50'::time, 'Rivendell Hall', '220', 2),
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 5, '09:00'::time, '09:50'::time, 'Rivendell Hall', '220', 3),
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'CLASS', 2, '10:00'::time, '11:15'::time, 'Rivendell Hall', '221', 1),
        ('TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'CLASS', 4, '10:00'::time, '11:15'::time, 'Rivendell Hall', '221', 2),
        ('TOLK', '261', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 3, '13:00'::time, '14:15'::time, 'Lore House', '104', 1),
        ('TOLK', '261', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'CLASS', 3, '13:30'::time, '14:45'::time, 'Lore House', '105', 1),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'LAB', 4, '14:00'::time, '15:15'::time, 'Language Hall', '212', 1),
        ('TOLK', '261L', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'LAB', 4, '14:30'::time, '15:45'::time, 'Language Hall', '213', 1),
        ('TOLK', '262', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 5, '10:00'::time, '11:15'::time, 'Rivendell Hall', '222', 1),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 1, '09:00'::time, '09:50'::time, 'Lore House', '210', 1),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 3, '09:00'::time, '09:50'::time, 'Lore House', '210', 2),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 5, '09:00'::time, '09:50'::time, 'Lore House', '210', 3),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'CLASS', 2, '10:00'::time, '11:15'::time, 'Lore House', '211', 1),
        ('TOLK', '263', 1, 'AY-2026-2027', 'FALL-2026', 'B', 'CLASS', 4, '10:00'::time, '11:15'::time, 'Lore House', '211', 2),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 1, '09:00'::time, '09:50'::time, 'Rivendell Hall', '220', 1),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 3, '09:00'::time, '09:50'::time, 'Rivendell Hall', '220', 2),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 5, '09:00'::time, '09:50'::time, 'Rivendell Hall', '220', 3),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'CLASS', 2, '10:00'::time, '11:15'::time, 'Rivendell Hall', '221', 1),
        ('TOLK', '260', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'CLASS', 4, '10:00'::time, '11:15'::time, 'Rivendell Hall', '221', 2),
        ('TOLK', '261', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 3, '13:00'::time, '14:15'::time, 'Lore House', '104', 1),
        ('TOLK', '261', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'CLASS', 3, '13:30'::time, '14:45'::time, 'Lore House', '105', 1),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'LAB', 4, '14:00'::time, '15:15'::time, 'Language Hall', '212', 1),
        ('TOLK', '261L', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'LAB', 4, '14:30'::time, '15:45'::time, 'Language Hall', '213', 1),
        ('TOLK', '262', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 5, '10:00'::time, '11:15'::time, 'Rivendell Hall', '222', 1),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 1, '09:00'::time, '09:50'::time, 'Lore House', '210', 1),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 3, '09:00'::time, '09:50'::time, 'Lore House', '210', 2),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'CLASS', 5, '09:00'::time, '09:50'::time, 'Lore House', '210', 3),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'CLASS', 2, '10:00'::time, '11:15'::time, 'Lore House', '211', 1),
        ('TOLK', '263', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'CLASS', 4, '10:00'::time, '11:15'::time, 'Lore House', '211', 2),
        ('TOLK', '264', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'CLASS', 1, '09:00'::time, '09:50'::time, 'Rivendell Hall', '230', 1),
        ('TOLK', '264', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'CLASS', 3, '09:00'::time, '09:50'::time, 'Rivendell Hall', '230', 2),
        ('TOLK', '264', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'CLASS', 5, '09:00'::time, '09:50'::time, 'Rivendell Hall', '230', 3),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'CLASS', 2, '15:00'::time, '16:15'::time, 'Lore House', '215', 1),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-A-2026', 'A', 'CLASS', 4, '15:00'::time, '16:15'::time, 'Lore House', '215', 2),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-B-2026', 'B', 'CLASS', 2, '15:00'::time, '16:15'::time, 'Lore House', '217', 1),
        ('TOLK', '265', 1, 'AY-2026-2027', 'FALL-B-2026', 'B', 'CLASS', 4, '15:00'::time, '16:15'::time, 'Lore House', '217', 2),
        ('TOLK', '266', 1, 'AY-2026-2027', 'FALL-B-2026', 'A', 'CLASS', 2, '15:00'::time, '16:15'::time, 'Lore House', '216', 1),
        ('TOLK', '266', 1, 'AY-2026-2027', 'FALL-B-2026', 'A', 'CLASS', 4, '15:00'::time, '16:15'::time, 'Lore House', '216', 2),
        ('TOLK', '270', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'CLASS', 1, '14:00'::time, '14:50'::time, 'Rivendell Hall', '240', 1),
        ('TOLK', '270', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'CLASS', 3, '14:00'::time, '14:50'::time, 'Rivendell Hall', '240', 2),
        ('TOLK', '270', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'CLASS', 5, '14:00'::time, '14:50'::time, 'Rivendell Hall', '240', 3),
        ('TOLK', '271', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'CLASS', 2, '08:30'::time, '09:45'::time, 'Lore House', '218', 1),
        ('TOLK', '271', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'CLASS', 4, '08:30'::time, '09:45'::time, 'Lore House', '218', 2),
        ('TOLK', '272', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'CLASS', 2, '12:30'::time, '13:45'::time, 'Language Hall', '214', 1),
        ('TOLK', '272', 1, 'AY-2025-2026', 'FALL-2025', 'A', 'CLASS', 4, '12:30'::time, '13:45'::time, 'Language Hall', '214', 2),
        ('TOLK', '276', 1, 'AY-2025-2026', 'SPRING-2026', 'A', 'CLASS', 1, '11:00'::time, '11:50'::time, 'Rivendell Hall', '242', 1),
        ('TOLK', '276', 1, 'AY-2025-2026', 'SPRING-2026', 'A', 'CLASS', 3, '11:00'::time, '11:50'::time, 'Rivendell Hall', '242', 2),
        ('TOLK', '276', 1, 'AY-2025-2026', 'SPRING-2026', 'A', 'CLASS', 5, '11:00'::time, '11:50'::time, 'Rivendell Hall', '242', 3),
        ('TOLK', '273', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 1, '12:00'::time, '12:50'::time, 'Rivendell Hall', '241', 1),
        ('TOLK', '273', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 3, '12:00'::time, '12:50'::time, 'Rivendell Hall', '241', 2),
        ('TOLK', '273', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 5, '12:00'::time, '12:50'::time, 'Rivendell Hall', '241', 3),
        ('TOLK', '274', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 2, '14:00'::time, '15:15'::time, 'Lore House', '219', 1),
        ('TOLK', '274', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 4, '14:00'::time, '15:15'::time, 'Lore House', '219', 2),
        ('TOLK', '275', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 5, '12:00'::time, '14:30'::time, 'Language Hall', '215', 1),
        ('TOLK', '277', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'CLASS', 4, '11:00'::time, '13:30'::time, 'Rivendell Hall', '243', 1)
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
SELECT section.section_id,
       meeting_type.section_meeting_type_id,
       desired_meetings.day_of_week,
       desired_meetings.start_time,
       desired_meetings.end_time,
       desired_meetings.building,
       desired_meetings.room,
       desired_meetings.sequence_number
FROM desired_meetings
JOIN academic_subject subject ON subject.code = desired_meetings.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_meetings.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = desired_meetings.version_number
JOIN academic_year year ON year.code = desired_meetings.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_meetings.sub_term_code
JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                           AND section.sub_term_id = sub_term.sub_term_id
                           AND section.section_letter = desired_meetings.section_letter
                           AND section.is_honors = FALSE
JOIN section_meeting_type meeting_type ON meeting_type.code = desired_meetings.meeting_type_code
ON CONFLICT ON CONSTRAINT uq_course_section_meeting_sequence DO UPDATE
SET section_meeting_type_id = EXCLUDED.section_meeting_type_id,
    day_of_week = EXCLUDED.day_of_week,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    building = EXCLUDED.building,
    room = EXCLUDED.room;

WITH desired_groups(
    academic_year_code,
    term_code,
    name,
    status,
    registration_opens_at,
    registration_closes_at,
    sort_order
) AS (
    VALUES
        ('AY-2026-2027', 'FALL-2026-2027', 'Sam Fall 2026 Registration', 'PUBLISHED', '2026-05-01 08:00'::timestamp, '2026-12-10 23:59'::timestamp, 10),
        ('AY-2027-2028', 'FALL-2027-2028', 'Sam Fall 2027 Registration', 'PUBLISHED', '2026-05-01 08:00'::timestamp, '2027-12-09 23:59'::timestamp, 20)
)
INSERT INTO registration_group (
    academic_year_id,
    term_id,
    name,
    status,
    registration_opens_at,
    registration_closes_at,
    sort_order,
    created_by_user_id,
    updated_by_user_id
)
SELECT year.academic_year_id,
       term.term_id,
       desired_groups.name,
       desired_groups.status,
       desired_groups.registration_opens_at,
       desired_groups.registration_closes_at,
       desired_groups.sort_order,
       actor.id,
       actor.id
FROM desired_groups
JOIN academic_year year ON year.code = desired_groups.academic_year_code
JOIN academic_term term ON term.academic_year_id = year.academic_year_id
                       AND term.code = desired_groups.term_code
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
WHERE NOT EXISTS (
    SELECT 1
    FROM registration_group existing_group
    WHERE existing_group.academic_year_id = year.academic_year_id
      AND existing_group.term_id = term.term_id
      AND existing_group.name = desired_groups.name
);

WITH desired_groups(
    academic_year_code,
    term_code,
    name,
    status,
    registration_opens_at,
    registration_closes_at,
    sort_order
) AS (
    VALUES
        ('AY-2026-2027', 'FALL-2026-2027', 'Sam Fall 2026 Registration', 'PUBLISHED', '2026-05-01 08:00'::timestamp, '2026-12-10 23:59'::timestamp, 10),
        ('AY-2027-2028', 'FALL-2027-2028', 'Sam Fall 2027 Registration', 'PUBLISHED', '2026-05-01 08:00'::timestamp, '2027-12-09 23:59'::timestamp, 20)
)
UPDATE registration_group registration_group
SET status = desired_groups.status,
    registration_opens_at = desired_groups.registration_opens_at,
    registration_closes_at = desired_groups.registration_closes_at,
    sort_order = desired_groups.sort_order,
    updated_by_user_id = actor.id
FROM desired_groups
JOIN academic_year year ON year.code = desired_groups.academic_year_code
JOIN academic_term term ON term.academic_year_id = year.academic_year_id
                       AND term.code = desired_groups.term_code
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
WHERE registration_group.academic_year_id = year.academic_year_id
  AND registration_group.term_id = term.term_id
  AND registration_group.name = desired_groups.name;

-- POC login for a student already registered in the full Fall 2026 section.
-- Password: Password123
INSERT INTO users (email, password_hash, enabled)
VALUES (
    'rosie.cotton@shire.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    enabled = EXCLUDED.enabled;

INSERT INTO user_roles (user_id, role_id)
SELECT users.id, roles.id
FROM users
JOIN roles ON roles.name = 'STUDENT'
WHERE users.email = 'rosie.cotton@shire.me'
ON CONFLICT DO NOTHING;

UPDATE student
SET user_id = users.id
FROM users
WHERE users.email = 'rosie.cotton@shire.me'
  AND student.alt_id = 'SEC-2001';

WITH desired_assignments(academic_year_code, term_code, group_name, student_alt_id) AS (
    VALUES
        ('AY-2026-2027', 'FALL-2026-2027', 'Sam Fall 2026 Registration', 'STU-1001'),
        ('AY-2026-2027', 'FALL-2026-2027', 'Sam Fall 2026 Registration', 'SEC-2001'),
        ('AY-2027-2028', 'FALL-2027-2028', 'Sam Fall 2027 Registration', 'STU-1001')
)
INSERT INTO registration_group_student (
    registration_group_id,
    student_id,
    academic_year_id,
    term_id,
    assignment_source,
    created_by_user_id,
    updated_by_user_id
)
SELECT registration_group.registration_group_id,
       student.student_id,
       year.academic_year_id,
       term.term_id,
       'MANUAL',
       actor.id,
       actor.id
FROM desired_assignments
JOIN academic_year year ON year.code = desired_assignments.academic_year_code
JOIN academic_term term ON term.academic_year_id = year.academic_year_id
                       AND term.code = desired_assignments.term_code
JOIN registration_group ON registration_group.academic_year_id = year.academic_year_id
                       AND registration_group.term_id = term.term_id
                       AND registration_group.name = desired_assignments.group_name
JOIN student ON student.alt_id = desired_assignments.student_alt_id
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
ON CONFLICT ON CONSTRAINT uq_registration_group_student DO UPDATE
SET academic_year_id = EXCLUDED.academic_year_id,
    term_id = EXCLUDED.term_id,
    assignment_source = EXCLUDED.assignment_source,
    updated_by_user_id = EXCLUDED.updated_by_user_id;

WITH target_sections AS (
    SELECT enrollment.student_section_enrollment_id
    FROM student_section_enrollment enrollment
    JOIN student ON student.student_id = enrollment.student_id
    JOIN course_section section ON section.section_id = enrollment.section_id
    JOIN academic_sub_term sub_term ON sub_term.sub_term_id = section.sub_term_id
    JOIN course_offering offering ON offering.course_offering_id = section.course_offering_id
    JOIN course_version version ON version.course_version_id = offering.course_version_id
    JOIN course ON course.course_id = version.course_id
    JOIN academic_subject subject ON subject.subject_id = course.subject_id
    JOIN academic_year year ON year.academic_year_id = offering.academic_year_id
    WHERE student.alt_id = 'STU-1001'
      AND subject.code = 'TOLK'
      AND course.course_number IN ('270', '271', '272', '276')
      AND version.version_number = 1
      AND section.section_letter = 'A'
      AND section.is_honors = FALSE
)
DELETE FROM student_section_enrollment_event event
USING target_sections
WHERE event.student_section_enrollment_id = target_sections.student_section_enrollment_id;

WITH target_sections AS (
    SELECT enrollment.student_section_enrollment_id
    FROM student_section_enrollment enrollment
    JOIN student ON student.student_id = enrollment.student_id
    JOIN course_section section ON section.section_id = enrollment.section_id
    JOIN academic_sub_term sub_term ON sub_term.sub_term_id = section.sub_term_id
    JOIN course_offering offering ON offering.course_offering_id = section.course_offering_id
    JOIN course_version version ON version.course_version_id = offering.course_version_id
    JOIN course ON course.course_id = version.course_id
    JOIN academic_subject subject ON subject.subject_id = course.subject_id
    JOIN academic_year year ON year.academic_year_id = offering.academic_year_id
    WHERE student.alt_id = 'STU-1001'
      AND subject.code = 'TOLK'
      AND course.course_number IN ('270', '271', '272', '276')
      AND version.version_number = 1
      AND section.section_letter = 'A'
      AND section.is_honors = FALSE
)
DELETE FROM student_section_grade grade
USING target_sections
WHERE grade.student_section_enrollment_id = target_sections.student_section_enrollment_id;

WITH target_sections AS (
    SELECT enrollment.student_section_enrollment_id
    FROM student_section_enrollment enrollment
    JOIN student ON student.student_id = enrollment.student_id
    JOIN course_section section ON section.section_id = enrollment.section_id
    JOIN academic_sub_term sub_term ON sub_term.sub_term_id = section.sub_term_id
    JOIN course_offering offering ON offering.course_offering_id = section.course_offering_id
    JOIN course_version version ON version.course_version_id = offering.course_version_id
    JOIN course ON course.course_id = version.course_id
    JOIN academic_subject subject ON subject.subject_id = course.subject_id
    JOIN academic_year year ON year.academic_year_id = offering.academic_year_id
    WHERE student.alt_id = 'STU-1001'
      AND subject.code = 'TOLK'
      AND course.course_number IN ('270', '271', '272', '276')
      AND version.version_number = 1
      AND section.section_letter = 'A'
      AND section.is_honors = FALSE
)
DELETE FROM student_section_enrollment enrollment
USING target_sections
WHERE enrollment.student_section_enrollment_id = target_sections.student_section_enrollment_id;

WITH desired_transcript_enrollments(
    course_number,
    academic_year_code,
    sub_term_code,
    status_code,
    enrollment_date,
    registered_at,
    status_changed_at,
    credits_earned,
    manual_add_reason
) AS (
    VALUES
        ('270', 'AY-2025-2026', 'FALL-2025', 'COMPLETED', '2025-08-25'::date, '2025-08-25 08:00'::timestamp, '2025-12-15 12:00'::timestamp, NULL::numeric, 'Minimum-grade POC: Sam failed this Fall 2025 prerequisite source course.'),
        ('271', 'AY-2025-2026', 'FALL-2025', 'COMPLETED', '2025-08-25'::date, '2025-08-25 08:00'::timestamp, '2025-12-15 12:00'::timestamp, 3.00, 'Minimum-grade POC: Sam passed this Fall 2025 prerequisite source course below the target minimum grade.'),
        ('272', 'AY-2025-2026', 'FALL-2025', 'COMPLETED', '2025-08-25'::date, '2025-08-25 08:00'::timestamp, '2025-12-15 12:00'::timestamp, 3.00, 'Minimum-grade POC: Sam passed this Fall 2025 prerequisite source course above the target minimum grade.'),
        ('276', 'AY-2025-2026', 'SPRING-2026', 'IN_PROGRESS', '2026-01-20'::date, '2026-01-20 08:00'::timestamp, '2026-01-20 08:00'::timestamp, NULL::numeric, 'Prerequisite POC: Sam is currently taking this Spring 2026 source course with no grade.')
)
INSERT INTO student_section_enrollment (
    student_id,
    section_id,
    student_section_enrollment_status_id,
    grading_basis_id,
    enrollment_date,
    registered_at,
    status_changed_at,
    status_changed_by_user_id,
    credits_attempted,
    credits_earned,
    include_in_gpa,
    capacity_override,
    manual_add_reason
)
SELECT student.student_id,
       section.section_id,
       enrollment_status.student_section_enrollment_status_id,
       grading_basis.grading_basis_id,
       desired_transcript_enrollments.enrollment_date,
       desired_transcript_enrollments.registered_at,
       desired_transcript_enrollments.status_changed_at,
       actor.id,
       3.00,
       desired_transcript_enrollments.credits_earned,
       TRUE,
       FALSE,
       desired_transcript_enrollments.manual_add_reason
FROM desired_transcript_enrollments
JOIN student ON student.alt_id = 'STU-1001'
JOIN academic_subject subject ON subject.code = 'TOLK'
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_transcript_enrollments.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = 1
JOIN academic_year year ON year.code = desired_transcript_enrollments.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_transcript_enrollments.sub_term_code
JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                           AND section.sub_term_id = sub_term.sub_term_id
                           AND section.section_letter = 'A'
                           AND section.is_honors = FALSE
JOIN student_section_enrollment_status enrollment_status
    ON enrollment_status.code = desired_transcript_enrollments.status_code
JOIN grading_basis ON grading_basis.code = 'GRADED'
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

WITH desired_legolas_gradebook_enrollments(
    student_alt_id,
    registered_at,
    manual_add_reason
) AS (
    VALUES
        ('STU-1002', '2026-01-20 08:05'::timestamp, 'Legolas grading demo: in-progress Spring 2026 roster student.'),
        ('STU-1003', '2026-01-20 08:10'::timestamp, 'Legolas grading demo: in-progress Spring 2026 roster student.'),
        ('STU-1004', '2026-01-20 08:15'::timestamp, 'Legolas grading demo: in-progress Spring 2026 roster student.')
)
INSERT INTO student_section_enrollment (
    student_id,
    section_id,
    student_section_enrollment_status_id,
    grading_basis_id,
    enrollment_date,
    registered_at,
    status_changed_at,
    status_changed_by_user_id,
    credits_attempted,
    credits_earned,
    include_in_gpa,
    capacity_override,
    manual_add_reason
)
SELECT student.student_id,
       section.section_id,
       enrollment_status.student_section_enrollment_status_id,
       grading_basis.grading_basis_id,
       '2026-01-20'::date,
       desired_legolas_gradebook_enrollments.registered_at,
       desired_legolas_gradebook_enrollments.registered_at,
       actor.id,
       3.00,
       NULL::numeric,
       TRUE,
       FALSE,
       desired_legolas_gradebook_enrollments.manual_add_reason
FROM desired_legolas_gradebook_enrollments
JOIN student ON student.alt_id = desired_legolas_gradebook_enrollments.student_alt_id
JOIN academic_subject subject ON subject.code = 'TOLK'
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = '276'
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = 1
JOIN academic_year year ON year.code = 'AY-2025-2026'
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = 'SPRING-2026'
JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                           AND section.sub_term_id = sub_term.sub_term_id
                           AND section.section_letter = 'A'
                           AND section.is_honors = FALSE
JOIN student_section_enrollment_status enrollment_status
    ON enrollment_status.code = 'IN_PROGRESS'
JOIN grading_basis ON grading_basis.code = 'GRADED'
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
ON CONFLICT ON CONSTRAINT uq_student_section_enrollment_student_section DO UPDATE
SET student_section_enrollment_status_id = EXCLUDED.student_section_enrollment_status_id,
    grading_basis_id = EXCLUDED.grading_basis_id,
    enrollment_date = EXCLUDED.enrollment_date,
    registered_at = EXCLUDED.registered_at,
    status_changed_at = EXCLUDED.status_changed_at,
    status_changed_by_user_id = EXCLUDED.status_changed_by_user_id,
    credits_attempted = EXCLUDED.credits_attempted,
    credits_earned = EXCLUDED.credits_earned,
    include_in_gpa = EXCLUDED.include_in_gpa,
    capacity_override = EXCLUDED.capacity_override,
    manual_add_reason = EXCLUDED.manual_add_reason;

WITH desired_grades(course_number, academic_year_code, sub_term_code, grade_type_code, grade_mark_code) AS (
    VALUES
        ('270', 'AY-2025-2026', 'FALL-2025', 'FINAL', 'F'),
        ('271', 'AY-2025-2026', 'FALL-2025', 'FINAL', 'C'),
        ('272', 'AY-2025-2026', 'FALL-2025', 'FINAL', 'A-'),
        ('276', 'AY-2025-2026', 'SPRING-2026', 'MIDTERM', 'C')
)
INSERT INTO student_section_grade (
    student_section_enrollment_id,
    student_section_grade_type_id,
    grade_mark_id,
    posted_by_user_id,
    is_current,
    posted_at
)
SELECT enrollment.student_section_enrollment_id,
       grade_type.student_section_grade_type_id,
       grade_mark.grade_mark_id,
       actor.id,
       TRUE,
       '2025-12-15 12:00'::timestamp
FROM desired_grades
JOIN student ON student.alt_id = 'STU-1001'
JOIN academic_subject subject ON subject.code = 'TOLK'
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_grades.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = 1
JOIN academic_year year ON year.code = desired_grades.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_grades.sub_term_code
JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                           AND section.sub_term_id = sub_term.sub_term_id
                           AND section.section_letter = 'A'
                           AND section.is_honors = FALSE
JOIN student_section_enrollment enrollment ON enrollment.student_id = student.student_id
                                          AND enrollment.section_id = section.section_id
JOIN student_section_grade_type grade_type ON grade_type.code = desired_grades.grade_type_code
JOIN grade_mark ON grade_mark.code = desired_grades.grade_mark_code
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

INSERT INTO student_section_enrollment_event (
    student_section_enrollment_id,
    event_type,
    from_student_section_enrollment_status_id,
    to_student_section_enrollment_status_id,
    actor_user_id,
    reason,
    created_at
)
SELECT DISTINCT enrollment.student_section_enrollment_id,
       'GRADE_POSTED',
       enrollment.student_section_enrollment_status_id,
       enrollment.student_section_enrollment_status_id,
       actor.id,
       'Minimum-grade POC seeded final grade.',
       '2025-12-15 12:00'::timestamp
FROM student_section_grade grade
JOIN student_section_enrollment enrollment
    ON enrollment.student_section_enrollment_id = grade.student_section_enrollment_id
JOIN student ON student.student_id = enrollment.student_id
JOIN course_section section ON section.section_id = enrollment.section_id
JOIN academic_sub_term sub_term ON sub_term.sub_term_id = section.sub_term_id
JOIN course_offering offering ON offering.course_offering_id = section.course_offering_id
JOIN course_version version ON version.course_version_id = offering.course_version_id
JOIN course ON course.course_id = version.course_id
JOIN academic_subject subject ON subject.subject_id = course.subject_id
JOIN academic_year year ON year.academic_year_id = offering.academic_year_id
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
WHERE student.alt_id = 'STU-1001'
  AND subject.code = 'TOLK'
  AND course.course_number IN ('270', '271', '272')
  AND version.version_number = 1
  AND year.code = 'AY-2025-2026'
  AND sub_term.code = 'FALL-2025'
  AND section.section_letter = 'A'
  AND section.is_honors = FALSE;

WITH target_section AS (
    SELECT section.section_id
    FROM academic_subject subject
    JOIN course ON course.subject_id = subject.subject_id
               AND course.course_number = '260'
    JOIN course_version version ON version.course_id = course.course_id
                               AND version.version_number = 1
    JOIN academic_year year ON year.code = 'AY-2026-2027'
    JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                                 AND offering.academic_year_id = year.academic_year_id
    JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                                   AND sub_term.code = 'FALL-2026'
    JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                               AND section.sub_term_id = sub_term.sub_term_id
                               AND section.section_letter = 'A'
                               AND section.is_honors = FALSE
    WHERE subject.code = 'TOLK'
),
target_students(alt_id) AS (
    VALUES
        ('STU-1001'),
        ('SEC-2001'), ('SEC-2002'), ('SEC-2003'), ('SEC-2004'), ('SEC-2005'),
        ('SEC-2006'), ('SEC-2007'), ('SEC-2008'), ('SEC-2009'), ('SEC-2010'),
        ('SEC-2011'), ('SEC-2012'), ('SEC-2013'), ('SEC-2014'), ('SEC-2015'),
        ('SEC-2016'), ('SEC-2017'), ('SEC-2018'), ('SEC-2019'), ('SEC-2020')
)
DELETE FROM student_section_waitlist_offer offer
USING student_section_enrollment enrollment,
      student,
      target_section,
      target_students
WHERE offer.student_section_enrollment_id = enrollment.student_section_enrollment_id
  AND enrollment.section_id = target_section.section_id
  AND student.student_id = enrollment.student_id
  AND student.alt_id = target_students.alt_id;

WITH target_section AS (
    SELECT section.section_id
    FROM academic_subject subject
    JOIN course ON course.subject_id = subject.subject_id
               AND course.course_number = '260'
    JOIN course_version version ON version.course_id = course.course_id
                               AND version.version_number = 1
    JOIN academic_year year ON year.code = 'AY-2026-2027'
    JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                                 AND offering.academic_year_id = year.academic_year_id
    JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                                   AND sub_term.code = 'FALL-2026'
    JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                               AND section.sub_term_id = sub_term.sub_term_id
                               AND section.section_letter = 'A'
                               AND section.is_honors = FALSE
    WHERE subject.code = 'TOLK'
),
target_students(alt_id) AS (
    VALUES
        ('STU-1001'),
        ('SEC-2001'), ('SEC-2002'), ('SEC-2003'), ('SEC-2004'), ('SEC-2005'),
        ('SEC-2006'), ('SEC-2007'), ('SEC-2008'), ('SEC-2009'), ('SEC-2010'),
        ('SEC-2011'), ('SEC-2012'), ('SEC-2013'), ('SEC-2014'), ('SEC-2015'),
        ('SEC-2016'), ('SEC-2017'), ('SEC-2018'), ('SEC-2019'), ('SEC-2020')
)
DELETE FROM student_section_enrollment enrollment
USING student,
      target_section,
      target_students
WHERE enrollment.section_id = target_section.section_id
  AND student.student_id = enrollment.student_id
  AND student.alt_id = target_students.alt_id;

WITH desired_enrollments(
    alt_id,
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    status_code,
    registered_at,
    waitlisted_at,
    waitlist_position
) AS (
    VALUES
        ('SEC-2001', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:00'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2002', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:02'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2003', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:04'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2004', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:06'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2005', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:08'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2006', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:10'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2007', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:12'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2008', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:14'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2009', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:16'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2010', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:18'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2011', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:20'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2012', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:22'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2013', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:24'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2014', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:26'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2015', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:28'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2016', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:30'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2017', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:32'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2018', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:34'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2019', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:36'::timestamp, NULL::timestamp, NULL::int),
        ('SEC-2020', 'TOLK', '260', 1, 'AY-2026-2027', 'FALL-2026', 'A', 'REGISTERED', '2026-05-01 09:38'::timestamp, NULL::timestamp, NULL::int)
)
INSERT INTO student_section_enrollment (
    student_id,
    section_id,
    student_section_enrollment_status_id,
    grading_basis_id,
    enrollment_date,
    registered_at,
    waitlisted_at,
    status_changed_at,
    status_changed_by_user_id,
    credits_attempted,
    credits_earned,
    waitlist_position,
    include_in_gpa,
    capacity_override,
    manual_add_reason
)
SELECT student.student_id,
       section.section_id,
       enrollment_status.student_section_enrollment_status_id,
       grading_basis.grading_basis_id,
       '2026-05-01'::date,
       desired_enrollments.registered_at,
       desired_enrollments.waitlisted_at,
       COALESCE(desired_enrollments.registered_at, desired_enrollments.waitlisted_at, CURRENT_TIMESTAMP),
       actor.id,
       3.00,
       NULL::numeric,
       desired_enrollments.waitlist_position,
       TRUE,
       FALSE,
       NULL
FROM desired_enrollments
JOIN student ON student.alt_id = desired_enrollments.alt_id
JOIN academic_subject subject ON subject.code = desired_enrollments.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_enrollments.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = desired_enrollments.version_number
JOIN academic_year year ON year.code = desired_enrollments.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_enrollments.sub_term_code
JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                           AND section.sub_term_id = sub_term.sub_term_id
                           AND section.section_letter = desired_enrollments.section_letter
                           AND section.is_honors = FALSE
JOIN student_section_enrollment_status enrollment_status ON enrollment_status.code = desired_enrollments.status_code
JOIN grading_basis ON grading_basis.code = 'GRADED'
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

INSERT INTO student_section_enrollment_event (
    student_section_enrollment_id,
    event_type,
    from_student_section_enrollment_status_id,
    to_student_section_enrollment_status_id,
    actor_user_id,
    reason,
    created_at
)
SELECT enrollment.student_section_enrollment_id,
       CASE
           WHEN enrollment_status.code = 'WAITLISTED' THEN 'WAITLISTED'
           ELSE 'REGISTERED'
       END,
       NULL,
       enrollment_status.student_section_enrollment_status_id,
       actor.id,
       enrollment.manual_add_reason,
       enrollment.status_changed_at
FROM student_section_enrollment enrollment
JOIN student student ON student.student_id = enrollment.student_id
JOIN course_section section ON section.section_id = enrollment.section_id
JOIN academic_sub_term sub_term ON sub_term.sub_term_id = section.sub_term_id
JOIN course_offering offering ON offering.course_offering_id = section.course_offering_id
JOIN course_version version ON version.course_version_id = offering.course_version_id
JOIN course ON course.course_id = version.course_id
JOIN academic_subject subject ON subject.subject_id = course.subject_id
JOIN academic_year year ON year.academic_year_id = offering.academic_year_id
JOIN student_section_enrollment_status enrollment_status
    ON enrollment_status.student_section_enrollment_status_id = enrollment.student_section_enrollment_status_id
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
WHERE subject.code = 'TOLK'
  AND course.course_number = '260'
  AND version.version_number = 1
  AND year.code = 'AY-2026-2027'
  AND sub_term.code = 'FALL-2026'
  AND section.section_letter = 'A'
  AND section.is_honors = FALSE
  AND student.alt_id IN (
      'STU-1001',
      'SEC-2001', 'SEC-2002', 'SEC-2003', 'SEC-2004', 'SEC-2005',
      'SEC-2006', 'SEC-2007', 'SEC-2008', 'SEC-2009', 'SEC-2010',
      'SEC-2011', 'SEC-2012', 'SEC-2013', 'SEC-2014', 'SEC-2015',
      'SEC-2016', 'SEC-2017', 'SEC-2018', 'SEC-2019', 'SEC-2020'
  );
