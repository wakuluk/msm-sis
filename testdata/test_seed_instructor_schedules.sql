-- Extra instructor schedule seed data for local development and manual testing.
-- Login candidate for "My Schedule": elrond@rivendell.me / Password123

WITH desired_instructor_users(email) AS (
    VALUES
        ('elrond@rivendell.me'),
        ('galadriel@lothlorien.me'),
        ('radagast@rhosgobel.me'),
        ('eowyn@rohan.me')
)
INSERT INTO users (email, password_hash, enabled)
SELECT desired_instructor_users.email,
       '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
       TRUE
FROM desired_instructor_users
WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE users.email = desired_instructor_users.email
);

WITH desired_instructor_user_roles(email, role_name) AS (
    VALUES
        ('elrond@rivendell.me', 'FACULTY'),
        ('galadriel@lothlorien.me', 'FACULTY'),
        ('radagast@rhosgobel.me', 'ADJUNCT'),
        ('eowyn@rohan.me', 'TEACHING_ASSISTANT')
)
INSERT INTO user_roles (user_id, role_id)
SELECT users.id, roles.id
FROM desired_instructor_user_roles
JOIN users ON users.email = desired_instructor_user_roles.email
JOIN roles ON roles.name = desired_instructor_user_roles.role_name
ON CONFLICT DO NOTHING;

WITH desired_instructors(first_name, last_name, email) AS (
    VALUES
        ('Elrond', 'Peredhel', 'elrond@rivendell.me'),
        ('Galadriel', 'Finarfiniel', 'galadriel@lothlorien.me'),
        ('Radagast', 'Brown', 'radagast@rhosgobel.me'),
        ('Eowyn', 'Shieldmaiden', 'eowyn@rohan.me')
)
INSERT INTO staff (user_id, first_name, last_name, email)
SELECT users.id,
       desired_instructors.first_name,
       desired_instructors.last_name,
       desired_instructors.email
FROM desired_instructors
JOIN users ON users.email = desired_instructors.email
WHERE NOT EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.email = desired_instructors.email
);

UPDATE staff
SET user_id = users.id
FROM users
WHERE users.email = staff.email
  AND staff.email IN (
    'elrond@rivendell.me',
    'galadriel@lothlorien.me',
    'radagast@rhosgobel.me',
    'eowyn@rohan.me'
  )
  AND staff.user_id IS NULL;

INSERT INTO academic_year (code, name, start_date, end_date, active, is_published, year_status_id)
SELECT 'AY-2028-2029',
       'Academic Year 2028-2029',
       '2028-08-01'::date,
       '2029-08-15'::date,
       FALSE,
       FALSE,
       year_status.year_status_id
FROM academic_year_status year_status
WHERE year_status.code = 'PLANNED'
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    active = EXCLUDED.active,
    is_published = EXCLUDED.is_published,
    year_status_id = EXCLUDED.year_status_id;

WITH desired_sub_terms(code, name, start_date, end_date, sort_order, status_code) AS (
    VALUES
        ('FALL-2028', 'Fall 2028', '2028-08-21'::date, '2028-12-08'::date, 202830, 'PLANNED'),
        ('FALL-A-2028', 'Fall 2028 Session A', '2028-08-21'::date, '2028-10-13'::date, 202831, 'PLANNED'),
        ('FALL-B-2028', 'Fall 2028 Session B', '2028-10-16'::date, '2028-12-08'::date, 202832, 'PLANNED'),
        ('SPRING-2029', 'Spring 2029', '2029-01-16'::date, '2029-05-04'::date, 202910, 'PLANNED'),
        ('SPRING-A-2029', 'Spring 2029 Session A', '2029-01-16'::date, '2029-03-08'::date, 202911, 'PLANNED'),
        ('SPRING-B-2029', 'Spring 2029 Session B', '2029-03-12'::date, '2029-05-04'::date, 202912, 'PLANNED'),
        ('SUMMER-I-2029', 'Summer I 2029', '2029-05-21'::date, '2029-06-22'::date, 202920, 'PLANNED'),
        ('SUMMER-II-2029', 'Summer II 2029', '2029-06-25'::date, '2029-07-27'::date, 202921, 'PLANNED')
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
SELECT academic_year.academic_year_id,
       desired_sub_terms.code,
       desired_sub_terms.name,
       desired_sub_terms.start_date,
       desired_sub_terms.end_date,
       desired_sub_terms.sort_order,
       sub_term_status.sub_term_status_id,
       TRUE
FROM desired_sub_terms
JOIN academic_year ON academic_year.code = 'AY-2028-2029'
JOIN academic_sub_term_status sub_term_status ON sub_term_status.code = desired_sub_terms.status_code
ON CONFLICT (academic_year_id, code) DO UPDATE
SET name = EXCLUDED.name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    sort_order = EXCLUDED.sort_order,
    sub_term_status_id = EXCLUDED.sub_term_status_id,
    active = EXCLUDED.active;

WITH desired_terms(code, name, start_date, end_date) AS (
    VALUES
        ('FALL-2028-2029', 'Fall 2028-2029', '2028-08-21'::date, '2028-12-08'::date),
        ('SPRING-2028-2029', 'Spring 2028-2029', '2029-01-16'::date, '2029-05-04'::date),
        ('SUMMER-2028-2029', 'Summer 2028-2029', '2029-05-21'::date, '2029-07-27'::date)
)
INSERT INTO academic_term (academic_year_id, code, name, start_date, end_date)
SELECT academic_year.academic_year_id,
       desired_terms.code,
       desired_terms.name,
       desired_terms.start_date,
       desired_terms.end_date
FROM desired_terms
JOIN academic_year ON academic_year.code = 'AY-2028-2029'
ON CONFLICT (academic_year_id, code) DO UPDATE
SET name = EXCLUDED.name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date;

WITH desired_term_sub_terms(term_code, sub_term_code) AS (
    VALUES
        ('FALL-2028-2029', 'FALL-2028'),
        ('FALL-2028-2029', 'FALL-A-2028'),
        ('FALL-2028-2029', 'FALL-B-2028'),
        ('SPRING-2028-2029', 'SPRING-2029'),
        ('SPRING-2028-2029', 'SPRING-A-2029'),
        ('SPRING-2028-2029', 'SPRING-B-2029'),
        ('SUMMER-2028-2029', 'SUMMER-I-2029'),
        ('SUMMER-2028-2029', 'SUMMER-II-2029')
)
INSERT INTO academic_term_sub_term (term_id, sub_term_id)
SELECT term.term_id,
       sub_term.sub_term_id
FROM desired_term_sub_terms
JOIN academic_year academic_year ON academic_year.code = 'AY-2028-2029'
JOIN academic_term term
    ON term.academic_year_id = academic_year.academic_year_id
   AND term.code = desired_term_sub_terms.term_code
JOIN academic_sub_term sub_term
    ON sub_term.academic_year_id = academic_year.academic_year_id
   AND sub_term.code = desired_term_sub_terms.sub_term_code
ON CONFLICT DO NOTHING;

WITH desired_offerings(subject_code, course_number, version_number, academic_year_code, notes) AS (
    VALUES
        ('TOLK', '101', 2, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('TOLK', '240', 1, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('TOLK', '260', 1, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('TOLK', '261', 1, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('TOLK', '261L', 1, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('TOLK', '480', 1, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('TOLK', '480', 1, 'AY-2027-2028', 'Instructor schedule demo offering.'),
        ('ELV', '201', 1, 'AY-2027-2028', 'Instructor schedule demo offering.'),
        ('ELV', '201', 1, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('ELV', '201L', 1, 'AY-2028-2029', 'Instructor schedule demo offering.'),
        ('MEH', '310', 1, 'AY-2028-2029', 'Instructor schedule demo offering.')
)
INSERT INTO course_offering (
    course_version_id,
    academic_year_id,
    notes
)
SELECT course_version.course_version_id,
       academic_year.academic_year_id,
       desired_offerings.notes
FROM desired_offerings
JOIN academic_subject subject ON subject.code = desired_offerings.subject_code
JOIN course course
    ON course.subject_id = subject.subject_id
   AND course.course_number = desired_offerings.course_number
JOIN course_version course_version
    ON course_version.course_id = course.course_id
   AND course_version.version_number = desired_offerings.version_number
JOIN academic_year academic_year ON academic_year.code = desired_offerings.academic_year_code
ON CONFLICT (course_version_id, academic_year_id) DO UPDATE
SET notes = EXCLUDED.notes;

WITH desired_offering_sub_terms(subject_code, course_number, version_number, academic_year_code, sub_term_code) AS (
    VALUES
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027'),
        ('ELV', '201', 1, 'AY-2027-2028', 'SPRING-2028'),
        ('TOLK', '480', 1, 'AY-2027-2028', 'SUMMER-II-2028'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-A-2028'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028'),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028'),
        ('TOLK', '260', 1, 'AY-2028-2029', 'FALL-B-2028'),
        ('ELV', '201', 1, 'AY-2028-2029', 'SPRING-2029'),
        ('ELV', '201L', 1, 'AY-2028-2029', 'SPRING-A-2029'),
        ('TOLK', '261', 1, 'AY-2028-2029', 'SPRING-B-2029'),
        ('TOLK', '261L', 1, 'AY-2028-2029', 'SPRING-B-2029'),
        ('MEH', '310', 1, 'AY-2028-2029', 'SUMMER-I-2029'),
        ('TOLK', '480', 1, 'AY-2028-2029', 'SUMMER-II-2029')
)
INSERT INTO course_offering_sub_term (
    course_offering_id,
    sub_term_id,
    academic_year_id
)
SELECT course_offering.course_offering_id,
       sub_term.sub_term_id,
       academic_year.academic_year_id
FROM desired_offering_sub_terms
JOIN academic_subject subject ON subject.code = desired_offering_sub_terms.subject_code
JOIN course course
    ON course.subject_id = subject.subject_id
   AND course.course_number = desired_offering_sub_terms.course_number
JOIN course_version course_version
    ON course_version.course_id = course.course_id
   AND course_version.version_number = desired_offering_sub_terms.version_number
JOIN academic_year academic_year ON academic_year.code = desired_offering_sub_terms.academic_year_code
JOIN course_offering course_offering
    ON course_offering.course_version_id = course_version.course_version_id
   AND course_offering.academic_year_id = academic_year.academic_year_id
JOIN academic_sub_term sub_term
    ON sub_term.academic_year_id = academic_year.academic_year_id
   AND sub_term.code = desired_offering_sub_terms.sub_term_code
ON CONFLICT DO NOTHING;

DELETE FROM course_section
WHERE notes LIKE 'Instructor schedule demo:%';

WITH desired_sections(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    status_code,
    academic_division_code,
    delivery_mode_code,
    grading_basis_code,
    credits,
    capacity,
    hard_capacity,
    waitlist_allowed,
    start_date,
    end_date,
    notes
) AS (
    VALUES
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'PLANNED', 'GRADUATE', 'IN_PERSON', 'GRADED', 3.00, 24, 28, TRUE, '2027-08-23'::date, '2027-12-10'::date, 'Instructor schedule demo: Elrond fall graduate history.'),
        ('ELV', '201', 1, 'AY-2027-2028', 'SPRING-2028', 'C', 'PLANNED', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 4.00, 20, 24, TRUE, '2028-01-18'::date, '2028-05-05'::date, 'Instructor schedule demo: Elrond spring language section.'),
        ('TOLK', '480', 1, 'AY-2027-2028', 'SUMMER-II-2028', 'B', 'PLANNED', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 2.00, 8, 8, FALSE, '2028-06-26'::date, '2028-07-28'::date, 'Instructor schedule demo: Elrond summer independent study.'),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'A', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 18, 22, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Elrond full fall seminar.'),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'B', 'DRAFT', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 18, 22, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Draft with instructor but no meeting time.'),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'C', 'DRAFT', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 18, 22, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Draft with meeting time but no instructor.'),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'D', 'PLANNED', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 3.00, 16, 20, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Planned with no instructor.'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'B', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 28, 32, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Elrond MWF evening survey.'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'C', 'DRAFT', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 3.00, 25, 30, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Draft missing instructor and meeting time.'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'D', 'DRAFT', 'UNDERGRADUATE', 'ONLINE', 'GRADED', 3.00, 35, 40, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Draft online section with no meeting rows.'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'E', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 28, 32, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Planned with instructor but no meeting time.'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'F', 'CLOSED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 28, 32, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: Closed section for stage progression testing.'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'G', 'IN_PROGRESS', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 28, 32, TRUE, '2028-08-21'::date, '2028-12-08'::date, 'Instructor schedule demo: In-progress section for stage progression testing.'),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-A-2028', 'A', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 30, 34, TRUE, '2028-08-21'::date, '2028-10-13'::date, 'Instructor schedule demo: Elrond fall session A survey.'),
        ('TOLK', '260', 1, 'AY-2028-2029', 'FALL-B-2028', 'A', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 3.00, 24, 28, TRUE, '2028-10-16'::date, '2028-12-08'::date, 'Instructor schedule demo: Elrond fall session B seminar.'),
        ('ELV', '201', 1, 'AY-2028-2029', 'SPRING-2029', 'A', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 4.00, 20, 24, TRUE, '2029-01-16'::date, '2029-05-04'::date, 'Instructor schedule demo: Galadriel full spring language.'),
        ('ELV', '201L', 1, 'AY-2028-2029', 'SPRING-A-2029', 'A', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 0.00, 20, 20, FALSE, '2029-01-16'::date, '2029-03-08'::date, 'Instructor schedule demo: Galadriel spring session A lab.'),
        ('TOLK', '261', 1, 'AY-2028-2029', 'SPRING-B-2029', 'A', 'PLANNED', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 3.00, 22, 26, TRUE, '2029-03-12'::date, '2029-05-04'::date, 'Instructor schedule demo: Radagast spring session B lecture.'),
        ('TOLK', '261L', 1, 'AY-2028-2029', 'SPRING-B-2029', 'A', 'PLANNED', 'UNDERGRADUATE', 'IN_PERSON', 'GRADED', 0.00, 22, 22, FALSE, '2029-03-12'::date, '2029-05-04'::date, 'Instructor schedule demo: Radagast spring session B lab.'),
        ('MEH', '310', 1, 'AY-2028-2029', 'SUMMER-I-2029', 'A', 'PLANNED', 'GRADUATE', 'ONLINE', 'GRADED', 3.00, 18, 22, TRUE, '2029-05-21'::date, '2029-06-22'::date, 'Instructor schedule demo: Elrond online summer section.'),
        ('TOLK', '480', 1, 'AY-2028-2029', 'SUMMER-II-2029', 'A', 'DRAFT', 'UNDERGRADUATE', 'HYBRID', 'GRADED', 2.00, 6, 6, FALSE, '2029-06-25'::date, '2029-07-27'::date, 'Instructor schedule demo: Elrond draft section for admin-only schedule search.')
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
SELECT course_offering.course_offering_id,
       sub_term.sub_term_id,
       academic_division.academic_division_id,
       desired_sections.section_letter,
       FALSE,
       section_status.course_section_status_id,
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
JOIN course course
    ON course.subject_id = subject.subject_id
   AND course.course_number = desired_sections.course_number
JOIN course_version course_version
    ON course_version.course_id = course.course_id
   AND course_version.version_number = desired_sections.version_number
JOIN academic_year academic_year ON academic_year.code = desired_sections.academic_year_code
JOIN course_offering course_offering
    ON course_offering.course_version_id = course_version.course_version_id
   AND course_offering.academic_year_id = academic_year.academic_year_id
JOIN academic_sub_term sub_term
    ON sub_term.academic_year_id = academic_year.academic_year_id
   AND sub_term.code = desired_sections.sub_term_code
JOIN academic_division ON academic_division.code = desired_sections.academic_division_code
JOIN course_section_status section_status ON section_status.code = desired_sections.status_code
JOIN delivery_mode ON delivery_mode.code = desired_sections.delivery_mode_code
JOIN grading_basis ON grading_basis.code = desired_sections.grading_basis_code;

WITH desired_section_instructors(
    subject_code,
    course_number,
    version_number,
    academic_year_code,
    sub_term_code,
    section_letter,
    staff_email,
    role_code,
    can_view_grades,
    can_manage_grades
) AS (
    VALUES
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('ELV', '201', 1, 'AY-2027-2028', 'SPRING-2028', 'C', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '480', 1, 'AY-2027-2028', 'SUMMER-II-2028', 'B', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'A', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'B', 'galadriel@lothlorien.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'B', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'D', 'radagast@rhosgobel.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'E', 'galadriel@lothlorien.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'F', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'G', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-A-2028', 'A', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '260', 1, 'AY-2028-2029', 'FALL-B-2028', 'A', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('MEH', '310', 1, 'AY-2028-2029', 'SUMMER-I-2029', 'A', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '480', 1, 'AY-2028-2029', 'SUMMER-II-2029', 'A', 'elrond@rivendell.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('ELV', '201', 1, 'AY-2028-2029', 'SPRING-2029', 'A', 'galadriel@lothlorien.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('ELV', '201L', 1, 'AY-2028-2029', 'SPRING-A-2029', 'A', 'galadriel@lothlorien.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '261', 1, 'AY-2028-2029', 'SPRING-B-2029', 'A', 'radagast@rhosgobel.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '261L', 1, 'AY-2028-2029', 'SPRING-B-2029', 'A', 'radagast@rhosgobel.me', 'PRIMARY_INSTRUCTOR', NULL, NULL),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-A-2028', 'A', 'eowyn@rohan.me', 'TEACHING_ASSISTANT', TRUE, FALSE),
        ('TOLK', '260', 1, 'AY-2028-2029', 'FALL-B-2028', 'A', 'eowyn@rohan.me', 'TEACHING_ASSISTANT', TRUE, FALSE),
        ('ELV', '201', 1, 'AY-2028-2029', 'SPRING-2029', 'A', 'eowyn@rohan.me', 'GRADER', TRUE, FALSE)
)
INSERT INTO course_section_instructor (
    section_id,
    instructor_user_id,
    instructional_assignment_role_id,
    can_view_grades,
    can_manage_grades
)
SELECT course_section.section_id,
       staff.user_id,
       assignment_role.instructional_assignment_role_id,
       COALESCE(desired_section_instructors.can_view_grades, assignment_role.default_can_view_grades),
       COALESCE(desired_section_instructors.can_manage_grades, assignment_role.default_can_manage_grades)
FROM desired_section_instructors
JOIN academic_subject subject ON subject.code = desired_section_instructors.subject_code
JOIN course course
    ON course.subject_id = subject.subject_id
   AND course.course_number = desired_section_instructors.course_number
JOIN course_version course_version
    ON course_version.course_id = course.course_id
   AND course_version.version_number = desired_section_instructors.version_number
JOIN academic_year academic_year ON academic_year.code = desired_section_instructors.academic_year_code
JOIN course_offering course_offering
    ON course_offering.course_version_id = course_version.course_version_id
   AND course_offering.academic_year_id = academic_year.academic_year_id
JOIN academic_sub_term sub_term
    ON sub_term.academic_year_id = academic_year.academic_year_id
   AND sub_term.code = desired_section_instructors.sub_term_code
JOIN course_section
    ON course_section.course_offering_id = course_offering.course_offering_id
   AND course_section.sub_term_id = sub_term.sub_term_id
   AND course_section.section_letter = desired_section_instructors.section_letter
   AND course_section.is_honors = FALSE
JOIN staff ON staff.email = desired_section_instructors.staff_email
JOIN instructional_assignment_role assignment_role ON assignment_role.code = desired_section_instructors.role_code
ON CONFLICT DO NOTHING;

WITH desired_section_meetings(
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
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'CLASS', 2, '13:00'::time, '14:15'::time, 'History Hall', '303', 1),
        ('MEH', '310', 1, 'AY-2027-2028', 'FALL-2027', 'B', 'CLASS', 4, '13:00'::time, '14:15'::time, 'History Hall', '303', 2),
        ('ELV', '201', 1, 'AY-2027-2028', 'SPRING-2028', 'C', 'CLASS', 1, '14:00'::time, '15:15'::time, 'Language Hall', '220', 1),
        ('ELV', '201', 1, 'AY-2027-2028', 'SPRING-2028', 'C', 'CLASS', 3, '14:00'::time, '15:15'::time, 'Language Hall', '220', 2),
        ('TOLK', '480', 1, 'AY-2027-2028', 'SUMMER-II-2028', 'B', 'CLASS', 2, '11:00'::time, '12:00'::time, 'Rivendell Hall', 'Faculty Suite', 1),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'A', 'CLASS', 2, '10:00'::time, '11:15'::time, 'Rivendell Hall', '110', 1),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'A', 'CLASS', 4, '10:00'::time, '11:15'::time, 'Rivendell Hall', '110', 2),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'C', 'CLASS', 2, '12:30'::time, '13:45'::time, 'Rivendell Hall', '112', 1),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'C', 'CLASS', 4, '12:30'::time, '13:45'::time, 'Rivendell Hall', '112', 2),
        ('TOLK', '240', 1, 'AY-2028-2029', 'FALL-2028', 'D', 'CLASS', 3, '15:00'::time, '16:15'::time, 'Rivendell Hall', '114', 1),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'B', 'CLASS', 1, '19:00'::time, '20:15'::time, 'Rivendell Hall', '208', 1),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'B', 'CLASS', 3, '19:00'::time, '20:15'::time, 'Rivendell Hall', '208', 2),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'B', 'CLASS', 5, '19:00'::time, '20:15'::time, 'Rivendell Hall', '208', 3),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'F', 'CLASS', 2, '08:00'::time, '09:15'::time, 'Rivendell Hall', '202', 1),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'F', 'CLASS', 4, '08:00'::time, '09:15'::time, 'Rivendell Hall', '202', 2),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'G', 'CLASS', 1, '11:30'::time, '12:20'::time, 'Rivendell Hall', '212', 1),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'G', 'CLASS', 3, '11:30'::time, '12:20'::time, 'Rivendell Hall', '212', 2),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-2028', 'G', 'CLASS', 5, '11:30'::time, '12:20'::time, 'Rivendell Hall', '212', 3),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-A-2028', 'A', 'CLASS', 1, '09:00'::time, '10:15'::time, 'Rivendell Hall', '204', 1),
        ('TOLK', '101', 2, 'AY-2028-2029', 'FALL-A-2028', 'A', 'CLASS', 3, '09:00'::time, '10:15'::time, 'Rivendell Hall', '204', 2),
        ('TOLK', '260', 1, 'AY-2028-2029', 'FALL-B-2028', 'A', 'CLASS', 1, '09:00'::time, '10:15'::time, 'Rivendell Hall', '206', 1),
        ('TOLK', '260', 1, 'AY-2028-2029', 'FALL-B-2028', 'A', 'CLASS', 3, '09:00'::time, '10:15'::time, 'Rivendell Hall', '206', 2),
        ('ELV', '201', 1, 'AY-2028-2029', 'SPRING-2029', 'A', 'CLASS', 2, '11:00'::time, '12:15'::time, 'Language Hall', '201', 1),
        ('ELV', '201', 1, 'AY-2028-2029', 'SPRING-2029', 'A', 'CLASS', 4, '11:00'::time, '12:15'::time, 'Language Hall', '201', 2),
        ('ELV', '201L', 1, 'AY-2028-2029', 'SPRING-A-2029', 'A', 'LAB', 5, '13:00'::time, '14:30'::time, 'Language Hall', '210', 1),
        ('TOLK', '261', 1, 'AY-2028-2029', 'SPRING-B-2029', 'A', 'CLASS', 1, '14:00'::time, '15:15'::time, 'Lore House', '012', 1),
        ('TOLK', '261', 1, 'AY-2028-2029', 'SPRING-B-2029', 'A', 'CLASS', 3, '14:00'::time, '15:15'::time, 'Lore House', '012', 2),
        ('TOLK', '261L', 1, 'AY-2028-2029', 'SPRING-B-2029', 'A', 'LAB', 3, '15:30'::time, '17:00'::time, 'Lore House', 'Studio', 1),
        ('MEH', '310', 1, 'AY-2028-2029', 'SUMMER-I-2029', 'A', 'CLASS', NULL, NULL, NULL, NULL, NULL, 1),
        ('TOLK', '480', 1, 'AY-2028-2029', 'SUMMER-II-2029', 'A', 'CLASS', 2, '10:00'::time, '11:00'::time, 'Rivendell Hall', 'Faculty Suite', 1)
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
JOIN academic_subject subject ON subject.code = desired_section_meetings.subject_code
JOIN course course
    ON course.subject_id = subject.subject_id
   AND course.course_number = desired_section_meetings.course_number
JOIN course_version course_version
    ON course_version.course_id = course.course_id
   AND course_version.version_number = desired_section_meetings.version_number
JOIN academic_year academic_year ON academic_year.code = desired_section_meetings.academic_year_code
JOIN course_offering course_offering
    ON course_offering.course_version_id = course_version.course_version_id
   AND course_offering.academic_year_id = academic_year.academic_year_id
JOIN academic_sub_term sub_term
    ON sub_term.academic_year_id = academic_year.academic_year_id
   AND sub_term.code = desired_section_meetings.sub_term_code
JOIN course_section
    ON course_section.course_offering_id = course_offering.course_offering_id
   AND course_section.sub_term_id = sub_term.sub_term_id
   AND course_section.section_letter = desired_section_meetings.section_letter
   AND course_section.is_honors = FALSE
JOIN section_meeting_type meeting_type ON meeting_type.code = desired_section_meetings.meeting_type_code;
