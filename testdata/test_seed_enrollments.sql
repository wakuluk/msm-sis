-- Course section enrollment seed data for local development and manual testing.

WITH seeded_sections(subject_code, course_number, version_number, academic_year_code, sub_term_code) AS (
    VALUES
        ('MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028'),
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027'),
        ('TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027')
)
DELETE FROM student_section_enrollment enrollment
USING seeded_sections,
      academic_subject subject,
      course,
      course_version version,
      academic_year year,
      course_offering offering,
      academic_sub_term sub_term,
      course_section section
WHERE subject.code = seeded_sections.subject_code
  AND course.subject_id = subject.subject_id
  AND course.course_number = seeded_sections.course_number
  AND version.course_id = course.course_id
  AND version.version_number = seeded_sections.version_number
  AND year.code = seeded_sections.academic_year_code
  AND offering.course_version_id = version.course_version_id
  AND offering.academic_year_id = year.academic_year_id
  AND sub_term.academic_year_id = year.academic_year_id
  AND sub_term.code = seeded_sections.sub_term_code
  AND section.course_offering_id = offering.course_offering_id
  AND section.sub_term_id = sub_term.sub_term_id
  AND enrollment.section_id = section.section_id;

DELETE FROM student
WHERE alt_id LIKE 'SEC-%';

WITH section_students(first_name, last_name, preferred_name, class_standing_id, alt_id, email) AS (
    VALUES
        ('Rosie', 'Cotton', 'Rosie', 1, 'SEC-2001', 'rosie.cotton@shire.me'),
        ('Fatty', 'Bolger', 'Fatty', 2, 'SEC-2002', 'fatty.bolger@shire.me'),
        ('Folco', 'Boffin', 'Folco', 2, 'SEC-2003', 'folco.boffin@shire.me'),
        ('Paladin', 'Took', 'Paladin', 3, 'SEC-2004', 'paladin.took@shire.me'),
        ('Diamond', 'Longcleeve', 'Diamond', 1, 'SEC-2005', 'diamond.longcleeve@shire.me'),
        ('Estella', 'Bolger', 'Estella', 2, 'SEC-2006', 'estella.bolger@shire.me'),
        ('Fredegar', 'Bolger', 'Fredegar', 3, 'SEC-2007', 'fredegar.bolger@shire.me'),
        ('Lobelia', 'Sackville-Baggins', 'Lobelia', 4, 'SEC-2008', 'lobelia.sackville@shire.me'),
        ('Beregond', 'Gondorion', 'Beregond', 3, 'SEC-2009', 'beregond@gondor.me'),
        ('Bergil', 'Gondorion', 'Bergil', 1, 'SEC-2010', 'bergil@gondor.me'),
        ('Faramir', 'Steward', 'Faramir', 4, 'SEC-2011', 'faramir@gondor.me'),
        ('Eowyn', 'Rohan', 'Eowyn', 4, 'SEC-2012', 'eowyn@rohan.me'),
        ('Eomer', 'Rohan', 'Eomer', 4, 'SEC-2013', 'eomer@rohan.me'),
        ('Theoden', 'Rohan', 'Theoden', 4, 'SEC-2014', 'theoden@rohan.me'),
        ('Hama', 'Rohan', 'Hama', 3, 'SEC-2015', 'hama@rohan.me'),
        ('Gamling', 'Rohan', 'Gamling', 3, 'SEC-2016', 'gamling@rohan.me'),
        ('Elrond', 'Peredhel', 'Elrond', 4, 'SEC-2017', 'elrond@rivendell.me'),
        ('Arwen', 'Undomiel', 'Arwen', 4, 'SEC-2018', 'arwen@rivendell.me'),
        ('Elladan', 'Peredhel', 'Elladan', 3, 'SEC-2019', 'elladan@rivendell.me'),
        ('Elrohir', 'Peredhel', 'Elrohir', 3, 'SEC-2020', 'elrohir@rivendell.me'),
        ('Galadriel', 'Lorien', 'Galadriel', 4, 'SEC-2021', 'galadriel@lorien.me'),
        ('Celeborn', 'Lorien', 'Celeborn', 4, 'SEC-2022', 'celeborn@lorien.me'),
        ('Haldir', 'Lorien', 'Haldir', 3, 'SEC-2023', 'haldir@lorien.me'),
        ('Thranduil', 'Mirkwood', 'Thranduil', 4, 'SEC-2024', 'thranduil@mirkwood.me'),
        ('Bard', 'Bowman', 'Bard', 3, 'SEC-2025', 'bard@dale.me'),
        ('Dain', 'Ironfoot', 'Dain', 4, 'SEC-2026', 'dain@erebor.me'),
        ('Balin', 'Fundinson', 'Balin', 4, 'SEC-2027', 'balin@erebor.me'),
        ('Dwalin', 'Fundinson', 'Dwalin', 3, 'SEC-2028', 'dwalin@erebor.me'),
        ('Ori', 'Erebor', 'Ori', 2, 'SEC-2029', 'ori@erebor.me'),
        ('Tauriel', 'Mirkwood', 'Tauriel', 3, 'SEC-2030', 'tauriel@mirkwood.me')
)
INSERT INTO student (
    first_name,
    last_name,
    gender_id,
    ethnicity_id,
    class_standing_id,
    preferred_name,
    estimated_grad_date,
    alt_id,
    email,
    is_disabled,
    updated_by
)
SELECT section_students.first_name,
       section_students.last_name,
       4,
       CASE
           WHEN section_students.email LIKE '%erebor.me' THEN 2
           WHEN section_students.email LIKE '%rivendell.me'
             OR section_students.email LIKE '%lorien.me'
             OR section_students.email LIKE '%mirkwood.me' THEN 3
           WHEN section_students.email LIKE '%shire.me' THEN 1
           ELSE 4
       END,
       section_students.class_standing_id,
       section_students.preferred_name,
       '2028-06-01'::date,
       section_students.alt_id,
       section_students.email,
       FALSE,
       'enrollment-seed'
FROM section_students;

WITH desired_enrollments(
    alt_id,
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    is_honors,
    status_code,
    grading_basis_code,
    enrollment_date,
    registered_at,
    waitlisted_at,
    credits_attempted,
    credits_earned,
    waitlist_position,
    include_in_gpa,
    capacity_override,
    manual_add_reason
) AS (
    VALUES
        ('STU-1001', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'COMPLETED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:04'::timestamp, NULL::timestamp, 3.00, 3.00, NULL::int, TRUE, FALSE, 'Repeat attempt completed for transcript POC.'),
        ('STU-1002', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:06'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('STU-1003', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:08'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('STU-1004', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:10'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2001', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:12'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2002', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:14'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2003', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'PASS_FAIL', '2028-01-18'::date, '2028-01-18 09:16'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, FALSE, FALSE, NULL),
        ('SEC-2004', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:18'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2005', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:20'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2006', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:22'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2007', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:24'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2008', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:26'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2009', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:28'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2010', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:30'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2011', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:32'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2012', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:34'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2013', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:36'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2014', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:38'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2015', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:40'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2016', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:42'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2017', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:44'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2018', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:46'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2019', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:48'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2020', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'REGISTERED', 'GRADED', '2028-01-18'::date, '2028-01-18 09:50'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2021', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'WAITLISTED', 'GRADED', '2028-01-18'::date, NULL::timestamp, '2028-01-18 10:00'::timestamp, 3.00, NULL::numeric, 1, TRUE, FALSE, NULL),
        ('SEC-2022', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'WAITLISTED', 'GRADED', '2028-01-18'::date, NULL::timestamp, '2028-01-18 10:02'::timestamp, 3.00, NULL::numeric, 2, TRUE, FALSE, NULL),
        ('SEC-2023', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', FALSE, 'WAITLISTED', 'GRADED', '2028-01-18'::date, NULL::timestamp, '2028-01-18 10:04'::timestamp, 3.00, NULL::numeric, 3, TRUE, FALSE, NULL),
        ('SEC-2024', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'B', FALSE, 'REGISTERED', 'PASS_FAIL', '2028-01-19'::date, '2028-01-19 11:00'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, FALSE, TRUE, 'Manual registrar placement for seminar balance.'),
        ('SEC-2025', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'B', FALSE, 'REGISTERED', 'PASS_FAIL', '2028-01-19'::date, '2028-01-19 11:05'::timestamp, NULL::timestamp, 3.00, NULL::numeric, NULL::int, FALSE, FALSE, NULL),
        ('STU-1001', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', FALSE, 'COMPLETED', 'GRADED', '2027-08-21'::date, '2027-08-21 13:55'::timestamp, NULL::timestamp, 3.00, 3.00, NULL::int, TRUE, FALSE, 'Earlier completed attempt replaced by repeat.'),
        ('SEC-2026', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', FALSE, 'COMPLETED', 'GRADED', '2027-08-21'::date, '2027-08-21 14:00'::timestamp, NULL::timestamp, 3.00, 3.00, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2027', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', FALSE, 'WITHDRAWN', 'GRADED', '2027-08-21'::date, '2027-08-21 14:03'::timestamp, NULL::timestamp, 3.00, 0.00, NULL::int, TRUE, FALSE, 'Withdrew before final grading.'),
        ('SEC-2028', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, 'COMPLETED', 'GRADED', '2027-01-16'::date, '2027-01-16 10:00'::timestamp, NULL::timestamp, 3.00, 3.00, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2029', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, 'COMPLETED', 'GRADED', '2027-01-16'::date, '2027-01-16 10:03'::timestamp, NULL::timestamp, 3.00, 3.00, NULL::int, TRUE, FALSE, NULL),
        ('SEC-2030', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', FALSE, 'DROPPED', 'GRADED', '2027-01-16'::date, '2027-01-16 10:05'::timestamp, NULL::timestamp, 3.00, 0.00, NULL::int, TRUE, FALSE, 'Dropped during add/drop.')
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
    drop_date,
    withdraw_date,
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
       desired_enrollments.enrollment_date,
       desired_enrollments.registered_at,
       desired_enrollments.waitlisted_at,
       COALESCE(desired_enrollments.registered_at, desired_enrollments.waitlisted_at, CURRENT_TIMESTAMP),
       actor.id,
       CASE WHEN desired_enrollments.status_code = 'DROPPED' THEN desired_enrollments.enrollment_date + 5 ELSE NULL END,
       CASE WHEN desired_enrollments.status_code = 'WITHDRAWN' THEN desired_enrollments.enrollment_date + 45 ELSE NULL END,
       desired_enrollments.credits_attempted,
       desired_enrollments.credits_earned,
       desired_enrollments.waitlist_position,
       desired_enrollments.include_in_gpa,
       desired_enrollments.capacity_override,
       desired_enrollments.manual_add_reason
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
                           AND section.is_honors = desired_enrollments.is_honors
JOIN student_section_enrollment_status enrollment_status ON enrollment_status.code = desired_enrollments.status_code
JOIN grading_basis ON grading_basis.code = desired_enrollments.grading_basis_code
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
           WHEN enrollment_status.code = 'DROPPED' THEN 'DROPPED'
           WHEN enrollment_status.code = 'WITHDRAWN' THEN 'WITHDRAWN'
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
WHERE student.alt_id IN (
    'STU-1001', 'STU-1002', 'STU-1003', 'STU-1004',
    'SEC-2001', 'SEC-2002', 'SEC-2003', 'SEC-2004', 'SEC-2005',
    'SEC-2006', 'SEC-2007', 'SEC-2008', 'SEC-2009', 'SEC-2010',
    'SEC-2011', 'SEC-2012', 'SEC-2013', 'SEC-2014', 'SEC-2015',
    'SEC-2016', 'SEC-2017', 'SEC-2018', 'SEC-2019', 'SEC-2020',
    'SEC-2021', 'SEC-2022', 'SEC-2023', 'SEC-2024', 'SEC-2025',
    'SEC-2026', 'SEC-2027', 'SEC-2028', 'SEC-2029', 'SEC-2030'
)
  AND (
      (subject.code = 'MEH' AND course.course_number = '310' AND version.version_number = 1 AND year.code = 'AY-2027-2028' AND sub_term.code IN ('SPRING-2028', 'FALL-2027'))
      OR
      (subject.code = 'TOLK' AND course.course_number = '101' AND version.version_number = 2 AND year.code = 'AY-2026-2027' AND sub_term.code = 'SPRING-2027')
  );

WITH desired_grades(alt_id, subject_code, course_number, version_number, academic_year_code, sub_term_code, section_letter, grade_type_code, grade_mark_code) AS (
    VALUES
        ('STU-1001', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'A-'),
        ('STU-1001', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'FINAL', 'A-'),
        ('STU-1002', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'B+'),
        ('STU-1003', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'B'),
        ('STU-1004', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'A'),
        ('SEC-2001', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'C+'),
        ('SEC-2002', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'B-'),
        ('SEC-2003', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'P'),
        ('SEC-2004', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'A-'),
        ('SEC-2005', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'B+'),
        ('SEC-2006', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'C'),
        ('SEC-2007', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'B'),
        ('SEC-2008', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'A'),
        ('SEC-2021', 'MEH', '310', 1, 'AY-2027-2028', 'SPRING-2028', 'A', 'MIDTERM', 'B-'),
        ('STU-1001', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'MIDTERM', 'C+'),
        ('STU-1001', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'FINAL', 'C+'),
        ('SEC-2026', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'MIDTERM', 'B+'),
        ('SEC-2026', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'FINAL', 'A-'),
        ('SEC-2027', 'MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'A', 'MIDTERM', 'W'),
        ('SEC-2028', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', 'MIDTERM', 'A'),
        ('SEC-2028', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', 'FINAL', 'A'),
        ('SEC-2029', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', 'MIDTERM', 'B'),
        ('SEC-2029', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', 'FINAL', 'B+'),
        ('SEC-2030', 'TOLK', '101', 2, 'AY-2026-2027', 'SPRING-2027', 'A', 'MIDTERM', 'W')
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
       CURRENT_TIMESTAMP
FROM desired_grades
JOIN student ON student.alt_id = desired_grades.alt_id
JOIN academic_subject subject ON subject.code = desired_grades.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_grades.course_number
JOIN course_version version ON version.course_id = course.course_id
                           AND version.version_number = desired_grades.version_number
JOIN academic_year year ON year.code = desired_grades.academic_year_code
JOIN course_offering offering ON offering.course_version_id = version.course_version_id
                             AND offering.academic_year_id = year.academic_year_id
JOIN academic_sub_term sub_term ON sub_term.academic_year_id = year.academic_year_id
                               AND sub_term.code = desired_grades.sub_term_code
JOIN course_section section ON section.course_offering_id = offering.course_offering_id
                           AND section.sub_term_id = sub_term.sub_term_id
                           AND section.section_letter = desired_grades.section_letter
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
       'Seeded grade data.',
       CURRENT_TIMESTAMP
FROM student_section_grade grade
JOIN student_section_enrollment enrollment
    ON enrollment.student_section_enrollment_id = grade.student_section_enrollment_id
JOIN student student ON student.student_id = enrollment.student_id
JOIN course_section section ON section.section_id = enrollment.section_id
JOIN academic_sub_term sub_term ON sub_term.sub_term_id = section.sub_term_id
JOIN course_offering offering ON offering.course_offering_id = section.course_offering_id
JOIN course_version version ON version.course_version_id = offering.course_version_id
JOIN course ON course.course_id = version.course_id
JOIN academic_subject subject ON subject.subject_id = course.subject_id
JOIN academic_year year ON year.academic_year_id = offering.academic_year_id
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
WHERE student.alt_id IN (
    'STU-1001', 'STU-1002', 'STU-1003', 'STU-1004',
    'SEC-2001', 'SEC-2002', 'SEC-2003', 'SEC-2004', 'SEC-2005',
    'SEC-2006', 'SEC-2007', 'SEC-2008', 'SEC-2021',
    'SEC-2026', 'SEC-2027', 'SEC-2028', 'SEC-2029', 'SEC-2030'
)
  AND (
      (subject.code = 'MEH' AND course.course_number = '310' AND version.version_number = 1 AND year.code = 'AY-2027-2028' AND sub_term.code IN ('SPRING-2028', 'FALL-2027'))
      OR
      (subject.code = 'TOLK' AND course.course_number = '101' AND version.version_number = 2 AND year.code = 'AY-2026-2027' AND sub_term.code = 'SPRING-2027')
  );

SELECT setval(pg_get_serial_sequence('student', 'student_id'), COALESCE((SELECT MAX(student_id) FROM student), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_section_enrollment', 'student_section_enrollment_id'), COALESCE((SELECT MAX(student_section_enrollment_id) FROM student_section_enrollment), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_section_grade', 'student_section_grade_id'), COALESCE((SELECT MAX(student_section_grade_id) FROM student_section_grade), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_section_enrollment_event', 'student_section_enrollment_event_id'), COALESCE((SELECT MAX(student_section_enrollment_event_id) FROM student_section_enrollment_event), 1), TRUE);
