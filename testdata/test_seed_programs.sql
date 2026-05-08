-- Program, version, and requirement seed data for local development.
-- This script is written to be rerunnable without duplicating rows.

WITH desired_programs(
    code,
    name,
    description,
    school_code,
    department_code,
    program_type_code,
    degree_type_code
) AS (
    VALUES
        (
            'HIST-BA',
            'History BA',
            'A broad historical studies program with upper-level seminar work.',
            'SHS',
            'HIST',
            'MAJOR',
            'BACHELOR'
        ),
        (
            'HIST-MA',
            'History MA',
            'Graduate historical study with research methods and thesis preparation.',
            'SHS',
            'HIST',
            'MAJOR',
            'MASTER'
        ),
        (
            'HUM-MIN',
            'Humanities Minor',
            'A flexible minor focused on literature, philosophy, and cultural studies.',
            'SLL',
            'HUM',
            'MINOR',
            NULL
        ),
        (
            'TOLK-BA',
            'Tolkien Studies BA',
            'Interdisciplinary study of literature, language, mythology, and worldbuilding.',
            'SLL',
            'HUM',
            'MAJOR',
            'BACHELOR'
        ),
        (
            'CORE-UG',
            'Undergraduate Core Curriculum',
            'University-wide undergraduate core curriculum requirements.',
            NULL,
            NULL,
            'CORE',
            NULL
        )
)
INSERT INTO program (
    code,
    name,
    description,
    school_id,
    department_id,
    program_type_id,
    degree_type_id
)
SELECT desired_programs.code,
       desired_programs.name,
       desired_programs.description,
       school.school_id,
       department.department_id,
       program_type.program_type_id,
       degree_type.degree_type_id
FROM desired_programs
LEFT JOIN academic_school school ON school.code = desired_programs.school_code
LEFT JOIN academic_department department ON department.code = desired_programs.department_code
                                        AND department.school_id = school.school_id
JOIN program_type ON program_type.code = desired_programs.program_type_code
LEFT JOIN degree_type ON degree_type.code = desired_programs.degree_type_code
WHERE NOT EXISTS (
    SELECT 1
    FROM program existing_program
    WHERE existing_program.code = desired_programs.code
);

WITH desired_programs(
    code,
    name,
    description,
    school_code,
    department_code,
    program_type_code,
    degree_type_code
) AS (
    VALUES
        ('HIST-BA', 'History BA', 'A broad historical studies program with upper-level seminar work.', 'SHS', 'HIST', 'MAJOR', 'BACHELOR'),
        ('HIST-MA', 'History MA', 'Graduate historical study with research methods and thesis preparation.', 'SHS', 'HIST', 'MAJOR', 'MASTER'),
        ('HUM-MIN', 'Humanities Minor', 'A flexible minor focused on literature, philosophy, and cultural studies.', 'SLL', 'HUM', 'MINOR', NULL),
        ('TOLK-BA', 'Tolkien Studies BA', 'Interdisciplinary study of literature, language, mythology, and worldbuilding.', 'SLL', 'HUM', 'MAJOR', 'BACHELOR'),
        ('CORE-UG', 'Undergraduate Core Curriculum', 'University-wide undergraduate core curriculum requirements.', NULL, NULL, 'CORE', NULL)
)
UPDATE program
SET name = desired_programs.name,
    description = desired_programs.description,
    school_id = school.school_id,
    department_id = department.department_id,
    program_type_id = program_type.program_type_id,
    degree_type_id = degree_type.degree_type_id
FROM desired_programs
LEFT JOIN academic_school school ON school.code = desired_programs.school_code
LEFT JOIN academic_department department ON department.code = desired_programs.department_code
                                        AND department.school_id = school.school_id
JOIN program_type ON program_type.code = desired_programs.program_type_code
LEFT JOIN degree_type ON degree_type.code = desired_programs.degree_type_code
WHERE program.code = desired_programs.code;

DELETE FROM program_type
WHERE code = 'MASTERS';

WITH desired_versions(
    program_code,
    version_number,
    is_published,
    class_year_start,
    class_year_end,
    notes
) AS (
    VALUES
        ('HIST-BA', 1, TRUE, 2024, 2026, 'Historical version retained for class-year matching.'),
        ('HIST-BA', 2, TRUE, 2027, NULL, 'Published open-ended version.'),
        ('HIST-MA', 1, TRUE, 2026, NULL, 'Initial published graduate program version.'),
        ('HUM-MIN', 1, TRUE, 2026, NULL, 'Initial published minor version.'),
        ('TOLK-BA', 1, FALSE, 2028, NULL, 'Draft version under review.'),
        ('CORE-UG', 1, TRUE, 2026, NULL, 'Initial published undergraduate core curriculum version.')
)
INSERT INTO program_version (
    program_id,
    version_number,
    is_published,
    class_year_start,
    class_year_end,
    notes
)
SELECT program.program_id,
       desired_versions.version_number,
       desired_versions.is_published,
       desired_versions.class_year_start,
       desired_versions.class_year_end,
       desired_versions.notes
FROM desired_versions
JOIN program ON program.code = desired_versions.program_code
WHERE NOT EXISTS (
    SELECT 1
    FROM program_version existing_version
    WHERE existing_version.program_id = program.program_id
      AND existing_version.version_number = desired_versions.version_number
);

WITH desired_versions(
    program_code,
    version_number,
    is_published,
    class_year_start,
    class_year_end,
    notes
) AS (
    VALUES
        ('HIST-BA', 1, TRUE, 2024, 2026, 'Historical version retained for class-year matching.'),
        ('HIST-BA', 2, TRUE, 2027, NULL, 'Published open-ended version.'),
        ('HIST-MA', 1, TRUE, 2026, NULL, 'Initial published graduate program version.'),
        ('HUM-MIN', 1, TRUE, 2026, NULL, 'Initial published minor version.'),
        ('TOLK-BA', 1, FALSE, 2028, NULL, 'Draft version under review.'),
        ('CORE-UG', 1, TRUE, 2026, NULL, 'Initial published undergraduate core curriculum version.')
)
UPDATE program_version
SET is_published = desired_versions.is_published,
    class_year_start = desired_versions.class_year_start,
    class_year_end = desired_versions.class_year_end,
    notes = desired_versions.notes
FROM desired_versions
JOIN program ON program.code = desired_versions.program_code
WHERE program_version.program_id = program.program_id
  AND program_version.version_number = desired_versions.version_number;

WITH desired_department_staff_roles(
    department_code,
    school_code,
    staff_email,
    role_code,
    start_date,
    end_date,
    active
) AS (
    VALUES
        ('HIST', 'SHS', 'gandalf@valinor.me', 'DEPARTMENT_HEAD', '2026-01-01'::date, NULL::date, TRUE),
        ('HUM', 'SLL', 'legolas@mirkwood.me', 'DEPARTMENT_HEAD', '2026-01-01'::date, NULL::date, TRUE)
)
INSERT INTO academic_department_staff_role (
    department_id,
    staff_id,
    role_code,
    start_date,
    end_date,
    active,
    updated_by_user_id
)
SELECT department.department_id,
       staff.id,
       desired_department_staff_roles.role_code,
       desired_department_staff_roles.start_date,
       desired_department_staff_roles.end_date,
       desired_department_staff_roles.active,
       actor.id
FROM desired_department_staff_roles
JOIN academic_school school ON school.code = desired_department_staff_roles.school_code
JOIN academic_department department ON department.code = desired_department_staff_roles.department_code
                                   AND department.school_id = school.school_id
JOIN staff ON staff.email = desired_department_staff_roles.staff_email
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
ON CONFLICT ON CONSTRAINT uq_academic_department_staff_role DO UPDATE
    SET start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        active = EXCLUDED.active,
        updated_by_user_id = EXCLUDED.updated_by_user_id;

WITH desired_requirements(
    code,
    name,
    requirement_type,
    description,
    minimum_credits,
    minimum_courses,
    course_match_mode,
    minimum_grade
) AS (
    VALUES
        (
            'REQ-HIST-CORE-12',
            'Complete 12 credits in history core courses',
            'DEPARTMENT_LEVEL_COURSES',
            'Students must complete at least 12 credits in the history core.',
            NULL,
            NULL,
            NULL,
            NULL
        ),
        (
            'REQ-MEH-310',
            'Complete MEH310',
            'SPECIFIC_COURSES',
            'Students must complete Middle-earth History 310.',
            NULL,
            NULL,
            'ALL',
            NULL
        ),
        (
            'REQ-HUM-ELECTIVE-9',
            'Complete 9 credits in humanities electives',
            'DEPARTMENT_LEVEL_COURSES',
            'Students must complete at least 9 elective credits in humanities subjects.',
            NULL,
            NULL,
            NULL,
            NULL
        ),
        (
            'REQ-FREE-ELECTIVE-30',
            'Complete 30 total elective credits',
            'TOTAL_ELECTIVE_CREDITS',
            'Students must complete at least 30 elective credits.',
            30.00,
            NULL,
            NULL,
            NULL
        ),
        (
            'REQ-HIST-THESIS',
            'Complete graduate thesis requirement',
            'MANUAL',
            'Graduate students must complete an approved thesis or capstone project.',
            NULL,
            NULL,
            NULL,
            NULL
        ),
        (
            'REQ-TOLK-101',
            'Complete TOLK101',
            'SPECIFIC_COURSES',
            'Students must complete Tolkien Studies 101.',
            NULL,
            NULL,
            'ALL',
            NULL
        ),
        (
            'REQ-TOLK-CHOOSE-2',
            'Choose two Tolkien studies courses',
            'SPECIFIC_COURSES',
            'Students must complete two courses from the approved Tolkien studies list.',
            NULL,
            2,
            'ANY',
            NULL
        ),
        (
            'REQ-TOLK-260-PREREQ',
            'Complete TOLK260 prerequisite test',
            'SPECIFIC_COURSES',
            'Seeded tracker test: TOLK 260 has TOLK 101 as a prerequisite.',
            NULL,
            NULL,
            'ALL',
            NULL
        ),
        (
            'REQ-TOLK-261-COREQ',
            'Complete TOLK261 corequisite pair',
            'SPECIFIC_COURSES',
            'Seeded tracker test: TOLK 261 has TOLK 261L as a corequisite.',
            NULL,
            NULL,
            'ALL',
            NULL
        ),
        (
            'REQ-TOLK-262-MISSING-PREREQ',
            'Complete TOLK262 missing prerequisite test',
            'SPECIFIC_COURSES',
            'Seeded tracker test: TOLK 262 has TOLK 240 as an unsatisfied prerequisite.',
            NULL,
            NULL,
            'ALL',
            NULL
        )
)
INSERT INTO requirement (
    code,
    name,
    requirement_type,
    description,
    minimum_credits,
    minimum_courses,
    course_match_mode,
    minimum_grade
)
SELECT desired_requirements.code,
       desired_requirements.name,
       desired_requirements.requirement_type,
       desired_requirements.description,
       desired_requirements.minimum_credits,
       desired_requirements.minimum_courses,
       desired_requirements.course_match_mode,
       desired_requirements.minimum_grade
FROM desired_requirements
WHERE NOT EXISTS (
    SELECT 1
    FROM requirement existing_requirement
    WHERE existing_requirement.code = desired_requirements.code
);

WITH desired_requirements(
    code,
    name,
    requirement_type,
    description,
    minimum_credits,
    minimum_courses,
    course_match_mode,
    minimum_grade
) AS (
    VALUES
        ('REQ-HIST-CORE-12', 'Complete 12 credits in history core courses', 'DEPARTMENT_LEVEL_COURSES', 'Students must complete at least 12 credits in the history core.', NULL, NULL, NULL, NULL),
        ('REQ-MEH-310', 'Complete MEH310', 'SPECIFIC_COURSES', 'Students must complete Middle-earth History 310.', NULL, NULL, 'ALL', NULL),
        ('REQ-HUM-ELECTIVE-9', 'Complete 9 credits in humanities electives', 'DEPARTMENT_LEVEL_COURSES', 'Students must complete at least 9 elective credits in humanities subjects.', NULL, NULL, NULL, NULL),
        ('REQ-FREE-ELECTIVE-30', 'Complete 30 total elective credits', 'TOTAL_ELECTIVE_CREDITS', 'Students must complete at least 30 elective credits.', 30.00, NULL, NULL, NULL),
        ('REQ-HIST-THESIS', 'Complete graduate thesis requirement', 'MANUAL', 'Graduate students must complete an approved thesis or capstone project.', NULL, NULL, NULL, NULL),
        ('REQ-TOLK-101', 'Complete TOLK101', 'SPECIFIC_COURSES', 'Students must complete Tolkien Studies 101.', NULL, NULL, 'ALL', NULL),
        ('REQ-TOLK-CHOOSE-2', 'Choose two Tolkien studies courses', 'SPECIFIC_COURSES', 'Students must complete two courses from the approved Tolkien studies list.', NULL, 2, 'ANY', NULL),
        ('REQ-TOLK-260-PREREQ', 'Complete TOLK260 prerequisite test', 'SPECIFIC_COURSES', 'Seeded tracker test: TOLK 260 has TOLK 101 as a prerequisite.', NULL, NULL, 'ALL', NULL),
        ('REQ-TOLK-261-COREQ', 'Complete TOLK261 corequisite pair', 'SPECIFIC_COURSES', 'Seeded tracker test: TOLK 261 has TOLK 261L as a corequisite.', NULL, NULL, 'ALL', NULL),
        ('REQ-TOLK-262-MISSING-PREREQ', 'Complete TOLK262 missing prerequisite test', 'SPECIFIC_COURSES', 'Seeded tracker test: TOLK 262 has TOLK 240 as an unsatisfied prerequisite.', NULL, NULL, 'ALL', NULL)
)
UPDATE requirement
SET name = desired_requirements.name,
    requirement_type = desired_requirements.requirement_type,
    description = desired_requirements.description,
    minimum_credits = desired_requirements.minimum_credits,
    minimum_courses = desired_requirements.minimum_courses,
    course_match_mode = desired_requirements.course_match_mode,
    minimum_grade = desired_requirements.minimum_grade
FROM desired_requirements
WHERE requirement.code = desired_requirements.code;

WITH desired_requirement_courses(
    requirement_code,
    subject_code,
    course_number,
    required,
    minimum_grade
) AS (
    VALUES
        ('REQ-MEH-310', 'MEH', '310', TRUE, NULL),
        ('REQ-TOLK-101', 'TOLK', '101', TRUE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'TOLK', '101', FALSE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'TOLK', '240', FALSE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'TOLK', '480', FALSE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'ELV', '201', FALSE, NULL),
        ('REQ-TOLK-260-PREREQ', 'TOLK', '260', TRUE, NULL),
        ('REQ-TOLK-261-COREQ', 'TOLK', '261', TRUE, NULL),
        ('REQ-TOLK-261-COREQ', 'TOLK', '261L', TRUE, NULL),
        ('REQ-TOLK-262-MISSING-PREREQ', 'TOLK', '262', TRUE, NULL)
)
INSERT INTO requirement_course (
    requirement_id,
    course_id,
    required,
    minimum_grade
)
SELECT requirement.requirement_id,
       course.course_id,
       desired_requirement_courses.required,
       desired_requirement_courses.minimum_grade
FROM desired_requirement_courses
JOIN requirement ON requirement.code = desired_requirement_courses.requirement_code
JOIN academic_subject subject ON subject.code = desired_requirement_courses.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_requirement_courses.course_number
WHERE NOT EXISTS (
    SELECT 1
    FROM requirement_course existing_requirement_course
    WHERE existing_requirement_course.requirement_id = requirement.requirement_id
      AND existing_requirement_course.course_id = course.course_id
);

WITH desired_requirement_courses(
    requirement_code,
    subject_code,
    course_number,
    required,
    minimum_grade
) AS (
    VALUES
        ('REQ-MEH-310', 'MEH', '310', TRUE, NULL),
        ('REQ-TOLK-101', 'TOLK', '101', TRUE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'TOLK', '101', FALSE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'TOLK', '240', FALSE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'TOLK', '480', FALSE, NULL),
        ('REQ-TOLK-CHOOSE-2', 'ELV', '201', FALSE, NULL),
        ('REQ-TOLK-260-PREREQ', 'TOLK', '260', TRUE, NULL),
        ('REQ-TOLK-261-COREQ', 'TOLK', '261', TRUE, NULL),
        ('REQ-TOLK-261-COREQ', 'TOLK', '261L', TRUE, NULL),
        ('REQ-TOLK-262-MISSING-PREREQ', 'TOLK', '262', TRUE, NULL)
)
UPDATE requirement_course
SET required = desired_requirement_courses.required,
    minimum_grade = desired_requirement_courses.minimum_grade
FROM desired_requirement_courses
JOIN requirement ON requirement.code = desired_requirement_courses.requirement_code
JOIN academic_subject subject ON subject.code = desired_requirement_courses.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_requirement_courses.course_number
WHERE requirement_course.requirement_id = requirement.requirement_id
  AND requirement_course.course_id = course.course_id;

WITH desired_department_rules(
    requirement_code,
    department_code,
    minimum_course_number,
    maximum_course_number,
    minimum_credits,
    minimum_courses,
    minimum_grade
) AS (
    VALUES
        ('REQ-HIST-CORE-12', 'HIST', 300::int, NULL::int, 12.00::numeric, NULL::int, NULL::varchar),
        ('REQ-HUM-ELECTIVE-9', 'HUM', 100::int, NULL::int, 9.00::numeric, NULL::int, NULL::varchar)
)
INSERT INTO requirement_course_rule (
    requirement_id,
    department_id,
    minimum_course_number,
    maximum_course_number,
    minimum_credits,
    minimum_courses,
    minimum_grade
)
SELECT requirement.requirement_id,
       department.department_id,
       desired_department_rules.minimum_course_number,
       desired_department_rules.maximum_course_number,
       desired_department_rules.minimum_credits,
       desired_department_rules.minimum_courses,
       desired_department_rules.minimum_grade
FROM desired_department_rules
JOIN requirement ON requirement.code = desired_department_rules.requirement_code
JOIN academic_department department ON department.code = desired_department_rules.department_code
WHERE NOT EXISTS (
    SELECT 1
    FROM requirement_course_rule existing_rule
    WHERE existing_rule.requirement_id = requirement.requirement_id
      AND existing_rule.department_id = department.department_id
      AND existing_rule.minimum_course_number IS NOT DISTINCT FROM desired_department_rules.minimum_course_number
      AND existing_rule.maximum_course_number IS NOT DISTINCT FROM desired_department_rules.maximum_course_number
);

WITH desired_department_rules(
    requirement_code,
    department_code,
    minimum_course_number,
    maximum_course_number,
    minimum_credits,
    minimum_courses,
    minimum_grade
) AS (
    VALUES
        ('REQ-HIST-CORE-12', 'HIST', 300::int, NULL::int, 12.00::numeric, NULL::int, NULL::varchar),
        ('REQ-HUM-ELECTIVE-9', 'HUM', 100::int, NULL::int, 9.00::numeric, NULL::int, NULL::varchar)
)
UPDATE requirement_course_rule
SET minimum_credits = desired_department_rules.minimum_credits,
    minimum_courses = desired_department_rules.minimum_courses,
    minimum_grade = desired_department_rules.minimum_grade
FROM desired_department_rules
JOIN requirement ON requirement.code = desired_department_rules.requirement_code
JOIN academic_department department ON department.code = desired_department_rules.department_code
WHERE requirement_course_rule.requirement_id = requirement.requirement_id
  AND requirement_course_rule.department_id = department.department_id
  AND requirement_course_rule.minimum_course_number IS NOT DISTINCT FROM desired_department_rules.minimum_course_number
  AND requirement_course_rule.maximum_course_number IS NOT DISTINCT FROM desired_department_rules.maximum_course_number;

WITH desired_assignments(
    program_code,
    version_number,
    requirement_code,
    sort_order,
    required,
    course_reuse_policy,
    notes
) AS (
    VALUES
        ('HIST-BA', 1, 'REQ-MEH-310', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 1, 'REQ-HIST-CORE-12', 20, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 1, 'REQ-FREE-ELECTIVE-30', 30, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-MEH-310', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-HIST-CORE-12', 20, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-HUM-ELECTIVE-9', 30, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-FREE-ELECTIVE-30', 40, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-MA', 1, 'REQ-HIST-THESIS', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-MA', 1, 'REQ-FREE-ELECTIVE-30', 20, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-MA', 1, 'REQ-TOLK-262-MISSING-PREREQ', 30, TRUE, 'CONSUME_AVAILABLE', 'Seeded graduate prerequisite test case for Gloinson.'),
        ('HIST-MA', 1, 'REQ-TOLK-261-COREQ', 40, TRUE, 'CONSUME_AVAILABLE', 'Seeded graduate corequisite test case for Gloinson.'),
        ('HUM-MIN', 1, 'REQ-HUM-ELECTIVE-9', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('TOLK-BA', 1, 'REQ-TOLK-101', 10, TRUE, 'CONSUME_AVAILABLE', 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-TOLK-CHOOSE-2', 20, TRUE, 'CONSUME_AVAILABLE', 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-HUM-ELECTIVE-9', 30, TRUE, 'CONSUME_AVAILABLE', 'Draft assignment for review.'),
        ('CORE-UG', 1, 'REQ-TOLK-CHOOSE-2', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('CORE-UG', 1, 'REQ-HUM-ELECTIVE-9', 20, TRUE, 'ALLOW_REUSE', NULL),
        ('CORE-UG', 1, 'REQ-TOLK-260-PREREQ', 30, TRUE, 'CONSUME_AVAILABLE', 'Seeded prerequisite test case for Samwise.'),
        ('CORE-UG', 1, 'REQ-TOLK-261-COREQ', 40, TRUE, 'CONSUME_AVAILABLE', 'Seeded corequisite test case for Samwise.'),
        ('CORE-UG', 1, 'REQ-TOLK-262-MISSING-PREREQ', 45, TRUE, 'CONSUME_AVAILABLE', 'Seeded missing prerequisite test case for Samwise.')
)
INSERT INTO program_version_requirement (
    program_version_id,
    requirement_id,
    sort_order,
    required,
    course_reuse_policy,
    notes
)
SELECT program_version.program_version_id,
       requirement.requirement_id,
       desired_assignments.sort_order,
       desired_assignments.required,
       desired_assignments.course_reuse_policy,
       desired_assignments.notes
FROM desired_assignments
JOIN program ON program.code = desired_assignments.program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_assignments.version_number
JOIN requirement ON requirement.code = desired_assignments.requirement_code
WHERE NOT EXISTS (
    SELECT 1
    FROM program_version_requirement existing_assignment
    WHERE existing_assignment.program_version_id = program_version.program_version_id
      AND existing_assignment.requirement_id = requirement.requirement_id
);

WITH desired_assignments(
    program_code,
    version_number,
    requirement_code,
    sort_order,
    required,
    course_reuse_policy,
    notes
) AS (
    VALUES
        ('HIST-BA', 1, 'REQ-MEH-310', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 1, 'REQ-HIST-CORE-12', 20, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 1, 'REQ-FREE-ELECTIVE-30', 30, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-MEH-310', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-HIST-CORE-12', 20, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-HUM-ELECTIVE-9', 30, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-BA', 2, 'REQ-FREE-ELECTIVE-30', 40, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-MA', 1, 'REQ-HIST-THESIS', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-MA', 1, 'REQ-FREE-ELECTIVE-30', 20, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('HIST-MA', 1, 'REQ-TOLK-262-MISSING-PREREQ', 30, TRUE, 'CONSUME_AVAILABLE', 'Seeded graduate prerequisite test case for Gloinson.'),
        ('HIST-MA', 1, 'REQ-TOLK-261-COREQ', 40, TRUE, 'CONSUME_AVAILABLE', 'Seeded graduate corequisite test case for Gloinson.'),
        ('HUM-MIN', 1, 'REQ-HUM-ELECTIVE-9', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('TOLK-BA', 1, 'REQ-TOLK-101', 10, TRUE, 'CONSUME_AVAILABLE', 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-TOLK-CHOOSE-2', 20, TRUE, 'CONSUME_AVAILABLE', 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-HUM-ELECTIVE-9', 30, TRUE, 'CONSUME_AVAILABLE', 'Draft assignment for review.'),
        ('CORE-UG', 1, 'REQ-TOLK-CHOOSE-2', 10, TRUE, 'CONSUME_AVAILABLE', NULL),
        ('CORE-UG', 1, 'REQ-HUM-ELECTIVE-9', 20, TRUE, 'ALLOW_REUSE', NULL),
        ('CORE-UG', 1, 'REQ-TOLK-260-PREREQ', 30, TRUE, 'CONSUME_AVAILABLE', 'Seeded prerequisite test case for Samwise.'),
        ('CORE-UG', 1, 'REQ-TOLK-261-COREQ', 40, TRUE, 'CONSUME_AVAILABLE', 'Seeded corequisite test case for Samwise.'),
        ('CORE-UG', 1, 'REQ-TOLK-262-MISSING-PREREQ', 45, TRUE, 'CONSUME_AVAILABLE', 'Seeded missing prerequisite test case for Samwise.')
)
UPDATE program_version_requirement
SET sort_order = desired_assignments.sort_order,
    required = desired_assignments.required,
    course_reuse_policy = desired_assignments.course_reuse_policy,
    notes = desired_assignments.notes
FROM desired_assignments
JOIN program ON program.code = desired_assignments.program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_assignments.version_number
JOIN requirement ON requirement.code = desired_assignments.requirement_code
WHERE program_version_requirement.program_version_id = program_version.program_version_id
  AND program_version_requirement.requirement_id = requirement.requirement_id;

DELETE FROM program_version_requirement
USING program_version, program, requirement
WHERE program_version_requirement.program_version_id = program_version.program_version_id
  AND program_version.program_id = program.program_id
  AND program.code = 'CORE-UG'
  AND program_version_requirement.requirement_id = requirement.requirement_id
  AND requirement.code = 'REQ-ELV-201-COREQ';

DELETE FROM requirement_course
USING requirement
WHERE requirement_course.requirement_id = requirement.requirement_id
  AND requirement.code = 'REQ-ELV-201-COREQ';

DELETE FROM requirement
WHERE code = 'REQ-ELV-201-COREQ';

DELETE FROM program_version_requirement
USING program_version, program, requirement
WHERE program_version_requirement.program_version_id = program_version.program_version_id
  AND program_version.program_id = program.program_id
  AND program.code = 'CORE-UG'
  AND program_version_requirement.requirement_id = requirement.requirement_id
  AND requirement.code IN ('REQ-TOLK-240', 'REQ-TOLK-240-PREREQ', 'REQ-TOLK-480-COREQ');

DELETE FROM student_academic_plan_course
USING requirement
WHERE student_academic_plan_course.requirement_id = requirement.requirement_id
  AND requirement.code IN ('REQ-TOLK-240', 'REQ-TOLK-240-PREREQ', 'REQ-TOLK-480-COREQ');

DELETE FROM requirement_course
USING requirement
WHERE requirement_course.requirement_id = requirement.requirement_id
  AND requirement.code IN ('REQ-TOLK-240', 'REQ-TOLK-240-PREREQ', 'REQ-TOLK-480-COREQ');

DELETE FROM requirement
WHERE code IN ('REQ-TOLK-240', 'REQ-TOLK-240-PREREQ', 'REQ-TOLK-480-COREQ');

WITH desired_completion_requirements(
    program_code,
    version_number,
    minimum_count,
    sort_order,
    notes
) AS (
    VALUES
        ('CORE-UG', 1, 1, 50, 'Student must also complete another major or minor.')
)
INSERT INTO program_version_completion_requirement (
    program_version_id,
    minimum_count,
    sort_order,
    notes
)
SELECT program_version.program_version_id,
       desired_completion_requirements.minimum_count,
       desired_completion_requirements.sort_order,
       desired_completion_requirements.notes
FROM desired_completion_requirements
JOIN program ON program.code = desired_completion_requirements.program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_completion_requirements.version_number
WHERE NOT EXISTS (
    SELECT 1
    FROM program_version_completion_requirement existing_completion_requirement
    WHERE existing_completion_requirement.program_version_id = program_version.program_version_id
      AND existing_completion_requirement.notes = desired_completion_requirements.notes
);

WITH desired_completion_requirements(
    program_code,
    version_number,
    minimum_count,
    sort_order,
    notes
) AS (
    VALUES
        ('CORE-UG', 1, 1, 50, 'Student must also complete another major or minor.')
)
UPDATE program_version_completion_requirement
SET minimum_count = desired_completion_requirements.minimum_count,
    sort_order = desired_completion_requirements.sort_order,
    notes = desired_completion_requirements.notes
FROM desired_completion_requirements
JOIN program ON program.code = desired_completion_requirements.program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_completion_requirements.version_number
WHERE program_version_completion_requirement.program_version_id = program_version.program_version_id
  AND program_version_completion_requirement.notes = desired_completion_requirements.notes;

WITH desired_completion_requirement_options(
    program_code,
    version_number,
    completion_requirement_sort_order,
    required_program_type_code
) AS (
    VALUES
        ('CORE-UG', 1, 50, 'MAJOR'),
        ('CORE-UG', 1, 50, 'MINOR')
)
INSERT INTO program_version_completion_requirement_option (
    program_version_completion_requirement_id,
    required_program_type_id
)
SELECT completion_requirement.program_version_completion_requirement_id,
       program_type.program_type_id
FROM desired_completion_requirement_options
JOIN program ON program.code = desired_completion_requirement_options.program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_completion_requirement_options.version_number
JOIN program_version_completion_requirement completion_requirement
  ON completion_requirement.program_version_id = program_version.program_version_id
 AND completion_requirement.sort_order = desired_completion_requirement_options.completion_requirement_sort_order
JOIN program_type ON program_type.code = desired_completion_requirement_options.required_program_type_code
WHERE NOT EXISTS (
    SELECT 1
    FROM program_version_completion_requirement_option existing_option
    WHERE existing_option.program_version_completion_requirement_id = completion_requirement.program_version_completion_requirement_id
      AND existing_option.required_program_type_id = program_type.program_type_id
);

-- Student program tracker seed data.
-- This gives the My Programs page attached programs plus a saved planner shape.

WITH desired_student_programs(
    alt_id,
    program_code,
    version_number,
    status,
    declared_date,
    completed_date
) AS (
    VALUES
        ('STU-1001', 'CORE-UG', 1, 'ACTIVE', '2026-08-20'::date, NULL::date),
        ('STU-1001', 'HIST-BA', 2, 'ACTIVE', '2026-08-20'::date, NULL::date),
        ('STU-1002', 'HIST-BA', 1, 'EXPLORING', NULL::date, NULL::date),
        ('STU-1003', 'HUM-MIN', 1, 'EXPLORING', NULL::date, NULL::date),
        ('STU-1004', 'HIST-MA', 1, 'ACTIVE', '2026-08-20'::date, NULL::date),
        ('STU-1004', 'HUM-MIN', 1, 'EXPLORING', NULL::date, NULL::date),
        ('SEC-2029', 'CORE-UG', 1, 'ACTIVE', '2026-08-20'::date, NULL::date),
        ('SEC-2029', 'HUM-MIN', 1, 'ACTIVE', '2027-01-10'::date, NULL::date)
)
INSERT INTO student_program (
    student_id,
    program_version_id,
    status,
    declared_date,
    completed_date,
    updated_by_user_id
)
SELECT student.student_id,
       program_version.program_version_id,
       desired_student_programs.status,
       desired_student_programs.declared_date,
       desired_student_programs.completed_date,
       actor.id
FROM desired_student_programs
JOIN student ON student.alt_id = desired_student_programs.alt_id
JOIN program ON program.code = desired_student_programs.program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_student_programs.version_number
LEFT JOIN users actor ON actor.email = 'frodo@shire.me'
ON CONFLICT ON CONSTRAINT uq_student_program_version DO UPDATE
    SET status = EXCLUDED.status,
        declared_date = EXCLUDED.declared_date,
        completed_date = EXCLUDED.completed_date,
        updated_by_user_id = EXCLUDED.updated_by_user_id;

DELETE FROM student_program_request
USING student, program
WHERE student_program_request.student_id = student.student_id
  AND student_program_request.program_id = program.program_id
  AND (
      (student.alt_id = 'STU-1003' AND program.code = 'HUM-MIN')
      OR (student.alt_id = 'STU-1004' AND program.code = 'HUM-MIN')
  );

WITH desired_student_program_requests(
    alt_id,
    program_code,
    requested_version_number,
    student_program_version_number,
    department_approved_version_number,
    status,
    requested_at,
    department_reviewed_at,
    department_reviewed_by_email,
    department_signature_name,
    department_signature_email,
    department_comment,
    admin_reviewed_at,
    admin_reviewed_by_email,
    admin_signature_name,
    admin_signature_email,
    admin_comment
) AS (
    VALUES
        ('STU-1003', 'HUM-MIN', 1, 1, NULL::integer, 'REQUESTED', '2026-05-02 10:30:00'::timestamp, NULL::timestamp, NULL, NULL, NULL, NULL, NULL::timestamp, NULL, NULL, NULL, NULL),
        ('STU-1004', 'HUM-MIN', 1, 1, NULL::integer, 'REJECTED', '2026-04-20 08:45:00'::timestamp, '2026-04-21 09:30:00'::timestamp, 'legolas@mirkwood.me', 'Legolas Greenleaf', 'legolas@mirkwood.me', 'Department cannot approve this minor until the student confirms the revised plan with advising.', '2026-04-22 14:00:00'::timestamp, 'frodo@shire.me', 'Frodo Baggins', 'frodo@shire.me', 'Please meet with advising before resubmitting this program request.')
)
INSERT INTO student_program_request (
    student_id,
    program_id,
    student_program_id,
    requested_program_version_id,
    department_approved_program_version_id,
    status,
    requested_at,
    department_reviewed_at,
    department_reviewed_by_user_id,
    department_signature_name,
    department_signature_email,
    department_comment,
    admin_reviewed_at,
    admin_reviewed_by_user_id,
    admin_signature_name,
    admin_signature_email,
    admin_comment,
    updated_by_user_id
)
SELECT student.student_id,
       program.program_id,
       student_program.student_program_id,
       requested_version.program_version_id,
       department_approved_version.program_version_id,
       desired_student_program_requests.status,
       desired_student_program_requests.requested_at,
       desired_student_program_requests.department_reviewed_at,
       department_reviewer.id,
       desired_student_program_requests.department_signature_name,
       desired_student_program_requests.department_signature_email,
       desired_student_program_requests.department_comment,
       desired_student_program_requests.admin_reviewed_at,
       admin_reviewer.id,
       desired_student_program_requests.admin_signature_name,
       desired_student_program_requests.admin_signature_email,
       desired_student_program_requests.admin_comment,
       actor.id
FROM desired_student_program_requests
JOIN student ON student.alt_id = desired_student_program_requests.alt_id
JOIN program ON program.code = desired_student_program_requests.program_code
JOIN program_version requested_version ON requested_version.program_id = program.program_id
                                   AND requested_version.version_number = desired_student_program_requests.requested_version_number
JOIN program_version student_program_version ON student_program_version.program_id = program.program_id
                                            AND student_program_version.version_number = desired_student_program_requests.student_program_version_number
JOIN student_program ON student_program.student_id = student.student_id
                    AND student_program.program_version_id = student_program_version.program_version_id
LEFT JOIN program_version department_approved_version
  ON department_approved_version.program_id = program.program_id
 AND department_approved_version.version_number = desired_student_program_requests.department_approved_version_number
LEFT JOIN users department_reviewer ON department_reviewer.email = desired_student_program_requests.department_reviewed_by_email
LEFT JOIN users admin_reviewer ON admin_reviewer.email = desired_student_program_requests.admin_reviewed_by_email
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

WITH target_students AS (
    SELECT student_id
    FROM student
    WHERE alt_id IN ('STU-1001', 'STU-1004', 'SEC-2029')
)
UPDATE student_academic_plan
SET active = FALSE
WHERE student_id IN (SELECT student_id FROM target_students);

DELETE FROM student_academic_plan
WHERE name = 'Seeded My Programs Plan'
  AND student_id IN (
      SELECT student_id
      FROM student
      WHERE alt_id IN ('STU-1001', 'STU-1004', 'SEC-2029')
  );

WITH target_students AS (
    SELECT student_id
    FROM student
    WHERE alt_id IN ('STU-1001', 'STU-1004', 'SEC-2029')
)
INSERT INTO student_academic_plan (
    student_id,
    name,
    active,
    updated_by_user_id
)
SELECT target_students.student_id,
       'Seeded My Programs Plan',
       TRUE,
       actor.id
FROM target_students
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

WITH desired_years(
    alt_id,
    label,
    sort_order,
    can_remove
) AS (
    VALUES
        ('STU-1001', 'Year 1', 0, FALSE),
        ('STU-1001', 'Year 2', 1, FALSE),
        ('STU-1004', 'Year 1', 0, FALSE),
        ('STU-1004', 'Year 2', 1, FALSE),
        ('STU-1004', 'Year 3', 2, FALSE),
        ('STU-1004', 'Year 4', 3, FALSE),
        ('SEC-2029', 'Year 1', 0, FALSE),
        ('SEC-2029', 'Year 2', 1, FALSE),
        ('SEC-2029', 'Year 3', 2, FALSE),
        ('SEC-2029', 'Year 4', 3, FALSE)
)
INSERT INTO student_academic_plan_year (
    student_academic_plan_id,
    label,
    sort_order,
    can_remove,
    updated_by_user_id
)
SELECT plan.student_academic_plan_id,
       desired_years.label,
       desired_years.sort_order,
       desired_years.can_remove,
       actor.id
FROM desired_years
JOIN student ON student.alt_id = desired_years.alt_id
JOIN student_academic_plan plan
  ON plan.student_id = student.student_id
 AND plan.name = 'Seeded My Programs Plan'
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

WITH desired_terms(
    label,
    sort_order
) AS (
    VALUES
        ('Fall', 0),
        ('Spring', 1),
        ('Summer I', 2),
        ('Summer II', 3)
)
INSERT INTO student_academic_plan_term (
    student_academic_plan_year_id,
    label,
    sort_order,
    is_complete,
    updated_by_user_id
)
SELECT plan_year.student_academic_plan_year_id,
       desired_terms.label,
       desired_terms.sort_order,
       FALSE,
       actor.id
FROM student_academic_plan_year plan_year
JOIN student_academic_plan plan
  ON plan.student_academic_plan_id = plan_year.student_academic_plan_id
 AND plan.name = 'Seeded My Programs Plan'
CROSS JOIN desired_terms
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

WITH desired_plan_courses(
    alt_id,
    year_label,
    term_label,
    subject_code,
    course_number,
    student_program_code,
    student_program_version_number,
    requirement_code,
    credits,
    planner_bucket_code,
    planner_bucket_label,
    sort_order,
    notes
) AS (
    VALUES
        ('STU-1001', 'Year 1', 'Fall', 'TOLK', '260', 'CORE-UG', 1, 'REQ-TOLK-260-PREREQ', 3.00::numeric, 'FULL_TERM', NULL::varchar, 0, 'Prerequisite test: Sam has transfer credit for TOLK 101 before taking TOLK 260.'),
        ('STU-1001', 'Year 1', 'Fall', 'TOLK', '261', 'CORE-UG', 1, 'REQ-TOLK-261-COREQ', 3.00::numeric, 'FULL_TERM', NULL::varchar, 1, 'Corequisite test: TOLK 261 should be planned with TOLK 261L.'),
        ('STU-1001', 'Year 1', 'Fall', 'TOLK', '261L', 'CORE-UG', 1, 'REQ-TOLK-261-COREQ', 0.00::numeric, 'FULL_TERM', NULL::varchar, 2, 'Corequisite test: TOLK 261L is the paired lab for TOLK 261.'),
        ('STU-1001', 'Year 1', 'Fall', 'TOLK', '262', 'CORE-UG', 1, 'REQ-TOLK-262-MISSING-PREREQ', 3.00::numeric, 'FULL_TERM', NULL::varchar, 3, 'Missing prerequisite test: Sam does not have TOLK 240 before taking TOLK 262.'),
        ('STU-1004', 'Year 1', 'Fall', 'TOLK', '240', 'HIST-MA', 1, 'REQ-FREE-ELECTIVE-30', 3.00::numeric, 'SESSION_A', 'Session A', 0, 'Graduate subterm test: TOLK 240 is planned in Session A.'),
        ('STU-1004', 'Year 1', 'Fall', 'TOLK', '262', 'HIST-MA', 1, 'REQ-TOLK-262-MISSING-PREREQ', 3.00::numeric, 'SESSION_B', 'Session B', 1, 'Graduate subterm test: TOLK 262 should see TOLK 240 as planned earlier in Session A.'),
        ('STU-1004', 'Year 1', 'Spring', 'TOLK', '261', 'HIST-MA', 1, 'REQ-TOLK-261-COREQ', 3.00::numeric, 'SESSION_A', 'Session A', 0, 'Graduate subterm corequisite test: lecture is in Session A.'),
        ('STU-1004', 'Year 1', 'Spring', 'TOLK', '261L', 'HIST-MA', 1, 'REQ-TOLK-261-COREQ', 0.00::numeric, 'SESSION_B', 'Session B', 1, 'Graduate subterm corequisite test: lab is in Session B of the same term.'),
        ('SEC-2029', 'Year 1', 'Fall', 'TOLK', '101', 'CORE-UG', 1, 'REQ-TOLK-CHOOSE-2', 3.00::numeric, 'FULL_TERM', 'Full Term', 0, 'Completed locally before the seeded tracker plan.'),
        ('SEC-2029', 'Year 2', 'Fall', 'TOLK', '240', 'CORE-UG', 1, 'REQ-TOLK-CHOOSE-2', 3.00::numeric, 'SESSION_A', 'Session A', 0, 'Seeded with a planner bucket label for subterm grouping UI.'),
        ('SEC-2029', 'Year 2', 'Spring', 'ELV', '201', 'HUM-MIN', 1, 'REQ-HUM-ELECTIVE-9', 4.00::numeric, 'SESSION_B', 'Session B', 0, 'Humanities minor elective with a session bucket.')
)
INSERT INTO student_academic_plan_course (
    student_academic_plan_term_id,
    course_id,
    student_program_id,
    requirement_id,
    status,
    credits,
    planner_bucket_code,
    planner_bucket_label,
    sort_order,
    notes,
    updated_by_user_id
)
SELECT plan_term.student_academic_plan_term_id,
       course.course_id,
       student_program.student_program_id,
       requirement.requirement_id,
       'PLANNED',
       desired_plan_courses.credits,
       desired_plan_courses.planner_bucket_code,
       desired_plan_courses.planner_bucket_label,
       desired_plan_courses.sort_order,
       desired_plan_courses.notes,
       actor.id
FROM desired_plan_courses
JOIN student ON student.alt_id = desired_plan_courses.alt_id
JOIN student_academic_plan plan
  ON plan.student_id = student.student_id
 AND plan.name = 'Seeded My Programs Plan'
JOIN student_academic_plan_year plan_year
  ON plan_year.student_academic_plan_id = plan.student_academic_plan_id
 AND plan_year.label = desired_plan_courses.year_label
JOIN student_academic_plan_term plan_term
  ON plan_term.student_academic_plan_year_id = plan_year.student_academic_plan_year_id
 AND plan_term.label = desired_plan_courses.term_label
JOIN academic_subject subject ON subject.code = desired_plan_courses.subject_code
JOIN course ON course.subject_id = subject.subject_id
           AND course.course_number = desired_plan_courses.course_number
JOIN program ON program.code = desired_plan_courses.student_program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_plan_courses.student_program_version_number
JOIN student_program ON student_program.student_id = student.student_id
                    AND student_program.program_version_id = program_version.program_version_id
JOIN requirement ON requirement.code = desired_plan_courses.requirement_code
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

WITH desired_placeholder_plan_courses(
    alt_id,
    year_label,
    term_label,
    student_program_code,
    student_program_version_number,
    requirement_code,
    credits,
    planner_bucket_code,
    planner_bucket_label,
    placeholder_type,
    placeholder_label,
    placeholder_subject_code,
    placeholder_department_code,
    placeholder_minimum_course_number,
    placeholder_maximum_course_number,
    sort_order,
    notes
) AS (
    VALUES
        (
            'STU-1001',
            'Year 2',
            'Spring',
            'HIST-BA',
            2,
            'REQ-HIST-CORE-12',
            3.00::numeric,
            'FULL_TERM',
            NULL::varchar,
            'DEPARTMENT_ELECTIVE',
            'HIST 300+ elective',
            'HIST',
            'HIST',
            300::int,
            NULL::int,
            0,
            'Seeded department elective placeholder for testing planner course replacement.'
        ),
        (
            'STU-1001',
            'Year 2',
            'Fall',
            'HIST-BA',
            2,
            'REQ-FREE-ELECTIVE-30',
            3.00::numeric,
            'FULL_TERM',
            NULL::varchar,
            'ELECTIVE',
            'Free elective',
            NULL::varchar,
            NULL::varchar,
            NULL::int,
            NULL::int,
            0,
            'Seeded generic elective placeholder for testing planner course replacement.'
        )
)
INSERT INTO student_academic_plan_course (
    student_academic_plan_term_id,
    course_id,
    student_program_id,
    requirement_id,
    status,
    credits,
    planner_bucket_code,
    planner_bucket_label,
    placeholder_type,
    placeholder_label,
    placeholder_subject_code,
    placeholder_department_id,
    placeholder_minimum_course_number,
    placeholder_maximum_course_number,
    sort_order,
    notes,
    updated_by_user_id
)
SELECT plan_term.student_academic_plan_term_id,
       NULL,
       student_program.student_program_id,
       requirement.requirement_id,
       'PLANNED',
       desired_placeholder_plan_courses.credits,
       desired_placeholder_plan_courses.planner_bucket_code,
       desired_placeholder_plan_courses.planner_bucket_label,
       desired_placeholder_plan_courses.placeholder_type,
       desired_placeholder_plan_courses.placeholder_label,
       desired_placeholder_plan_courses.placeholder_subject_code,
       placeholder_department.department_id,
       desired_placeholder_plan_courses.placeholder_minimum_course_number,
       desired_placeholder_plan_courses.placeholder_maximum_course_number,
       desired_placeholder_plan_courses.sort_order,
       desired_placeholder_plan_courses.notes,
       actor.id
FROM desired_placeholder_plan_courses
JOIN student ON student.alt_id = desired_placeholder_plan_courses.alt_id
JOIN student_academic_plan plan
  ON plan.student_id = student.student_id
 AND plan.name = 'Seeded My Programs Plan'
JOIN student_academic_plan_year plan_year
  ON plan_year.student_academic_plan_id = plan.student_academic_plan_id
 AND plan_year.label = desired_placeholder_plan_courses.year_label
JOIN student_academic_plan_term plan_term
  ON plan_term.student_academic_plan_year_id = plan_year.student_academic_plan_year_id
 AND plan_term.label = desired_placeholder_plan_courses.term_label
JOIN program ON program.code = desired_placeholder_plan_courses.student_program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_placeholder_plan_courses.student_program_version_number
JOIN student_program ON student_program.student_id = student.student_id
                    AND student_program.program_version_id = program_version.program_version_id
JOIN requirement ON requirement.code = desired_placeholder_plan_courses.requirement_code
LEFT JOIN academic_department placeholder_department
       ON placeholder_department.code = desired_placeholder_plan_courses.placeholder_department_code
LEFT JOIN users actor ON actor.email = 'frodo@shire.me';

SELECT setval(pg_get_serial_sequence('student_program', 'student_program_id'), COALESCE((SELECT MAX(student_program_id) FROM student_program), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_program_request', 'student_program_request_id'), COALESCE((SELECT MAX(student_program_request_id) FROM student_program_request), 1), TRUE);
SELECT setval(pg_get_serial_sequence('program_version_completion_requirement', 'program_version_completion_requirement_id'), COALESCE((SELECT MAX(program_version_completion_requirement_id) FROM program_version_completion_requirement), 1), TRUE);
SELECT setval(pg_get_serial_sequence('program_version_completion_requirement_option', 'program_version_completion_requirement_option_id'), COALESCE((SELECT MAX(program_version_completion_requirement_option_id) FROM program_version_completion_requirement_option), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_academic_plan', 'student_academic_plan_id'), COALESCE((SELECT MAX(student_academic_plan_id) FROM student_academic_plan), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_academic_plan_year', 'student_academic_plan_year_id'), COALESCE((SELECT MAX(student_academic_plan_year_id) FROM student_academic_plan_year), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_academic_plan_term', 'student_academic_plan_term_id'), COALESCE((SELECT MAX(student_academic_plan_term_id) FROM student_academic_plan_term), 1), TRUE);
SELECT setval(pg_get_serial_sequence('student_academic_plan_course', 'student_academic_plan_course_id'), COALESCE((SELECT MAX(student_academic_plan_course_id) FROM student_academic_plan_course), 1), TRUE);
