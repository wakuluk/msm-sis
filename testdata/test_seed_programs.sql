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
            'MASTERS',
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
        ('HIST-MA', 'History MA', 'Graduate historical study with research methods and thesis preparation.', 'SHS', 'HIST', 'MASTERS', 'MASTER'),
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
        ('REQ-TOLK-CHOOSE-2', 'Choose two Tolkien studies courses', 'SPECIFIC_COURSES', 'Students must complete two courses from the approved Tolkien studies list.', NULL, 2, 'ANY', NULL)
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
        ('REQ-TOLK-CHOOSE-2', 'ELV', '201', FALSE, NULL)
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
        ('REQ-TOLK-CHOOSE-2', 'ELV', '201', FALSE, NULL)
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
    notes
) AS (
    VALUES
        ('HIST-BA', 1, 'REQ-MEH-310', 10, TRUE, NULL),
        ('HIST-BA', 1, 'REQ-HIST-CORE-12', 20, TRUE, NULL),
        ('HIST-BA', 1, 'REQ-FREE-ELECTIVE-30', 30, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-MEH-310', 10, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-HIST-CORE-12', 20, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-HUM-ELECTIVE-9', 30, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-FREE-ELECTIVE-30', 40, TRUE, NULL),
        ('HIST-MA', 1, 'REQ-HIST-THESIS', 10, TRUE, NULL),
        ('HIST-MA', 1, 'REQ-FREE-ELECTIVE-30', 20, TRUE, NULL),
        ('HUM-MIN', 1, 'REQ-HUM-ELECTIVE-9', 10, TRUE, NULL),
        ('TOLK-BA', 1, 'REQ-TOLK-101', 10, TRUE, 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-TOLK-CHOOSE-2', 20, TRUE, 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-HUM-ELECTIVE-9', 30, TRUE, 'Draft assignment for review.'),
        ('CORE-UG', 1, 'REQ-HUM-ELECTIVE-9', 10, TRUE, NULL),
        ('CORE-UG', 1, 'REQ-TOLK-CHOOSE-2', 20, TRUE, NULL)
)
INSERT INTO program_version_requirement (
    program_version_id,
    requirement_id,
    sort_order,
    required,
    notes
)
SELECT program_version.program_version_id,
       requirement.requirement_id,
       desired_assignments.sort_order,
       desired_assignments.required,
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
    notes
) AS (
    VALUES
        ('HIST-BA', 1, 'REQ-MEH-310', 10, TRUE, NULL),
        ('HIST-BA', 1, 'REQ-HIST-CORE-12', 20, TRUE, NULL),
        ('HIST-BA', 1, 'REQ-FREE-ELECTIVE-30', 30, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-MEH-310', 10, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-HIST-CORE-12', 20, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-HUM-ELECTIVE-9', 30, TRUE, NULL),
        ('HIST-BA', 2, 'REQ-FREE-ELECTIVE-30', 40, TRUE, NULL),
        ('HIST-MA', 1, 'REQ-HIST-THESIS', 10, TRUE, NULL),
        ('HIST-MA', 1, 'REQ-FREE-ELECTIVE-30', 20, TRUE, NULL),
        ('HUM-MIN', 1, 'REQ-HUM-ELECTIVE-9', 10, TRUE, NULL),
        ('TOLK-BA', 1, 'REQ-TOLK-101', 10, TRUE, 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-TOLK-CHOOSE-2', 20, TRUE, 'Draft assignment for review.'),
        ('TOLK-BA', 1, 'REQ-HUM-ELECTIVE-9', 30, TRUE, 'Draft assignment for review.'),
        ('CORE-UG', 1, 'REQ-HUM-ELECTIVE-9', 10, TRUE, NULL),
        ('CORE-UG', 1, 'REQ-TOLK-CHOOSE-2', 20, TRUE, NULL)
)
UPDATE program_version_requirement
SET sort_order = desired_assignments.sort_order,
    required = desired_assignments.required,
    notes = desired_assignments.notes
FROM desired_assignments
JOIN program ON program.code = desired_assignments.program_code
JOIN program_version ON program_version.program_id = program.program_id
                    AND program_version.version_number = desired_assignments.version_number
JOIN requirement ON requirement.code = desired_assignments.requirement_code
WHERE program_version_requirement.program_version_id = program_version.program_version_id
  AND program_version_requirement.requirement_id = requirement.requirement_id;
