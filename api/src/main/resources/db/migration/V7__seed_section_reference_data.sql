INSERT INTO course_section_status (code, name, sort_order, allow_linear_shift) VALUES
    ('DRAFT', 'Draft', 1, TRUE),
    ('PLANNED', 'Planned', 2, TRUE),
    ('CLOSED', 'Closed', 3, TRUE),
    ('IN_PROGRESS', 'In progress', 4, TRUE),
    ('CANCELLED', 'Cancelled', 5, FALSE),
    ('COMPLETED', 'Completed', 6, FALSE);

INSERT INTO delivery_mode (code, name, sort_order) VALUES
    ('IN_PERSON', 'In person', 1),
    ('ONLINE', 'Online', 2),
    ('HYBRID', 'Hybrid', 3);

INSERT INTO grading_basis (
    code,
    name,
    sort_order,
    allowed_for_course_sections,
    allowed_for_student_enrollments
) VALUES
    ('GRADED', 'Graded', 1, TRUE, TRUE),
    ('PASS_FAIL', 'Pass/Fail', 2, TRUE, TRUE),
    ('AUDIT', 'Audit', 3, FALSE, TRUE);

INSERT INTO section_meeting_type (code, name, sort_order) VALUES
    ('CLASS', 'Class', 1),
    ('LAB', 'Lab', 2);

INSERT INTO section_instructor_role (code, name, sort_order) VALUES
    ('PRIMARY', 'Primary', 1),
    ('SECONDARY', 'Secondary', 2),
    ('TA', 'Teaching Assistant', 3);

INSERT INTO instructional_assignment_role (
    code,
    name,
    description,
    counts_for_conflict_check,
    default_can_view_grades,
    default_can_manage_grades,
    sort_order
) VALUES
    (
        'PRIMARY_INSTRUCTOR',
        'Primary Instructor',
        'Instructor of record for the section.',
        TRUE,
        TRUE,
        TRUE,
        1
    ),
    (
        'CO_INSTRUCTOR',
        'Co-Instructor',
        'Additional instructor assigned to teach the section.',
        TRUE,
        TRUE,
        TRUE,
        2
    ),
    (
        'TEACHING_ASSISTANT',
        'Teaching Assistant',
        'Teaching assistant supporting the section.',
        TRUE,
        TRUE,
        FALSE,
        3
    ),
    (
        'GRADER',
        'Grader',
        'Grade-entry support without a scheduled teaching assignment.',
        FALSE,
        TRUE,
        TRUE,
        4
    ),
    (
        'OBSERVER',
        'Observer',
        'Read-only section observer without schedule or grading responsibility.',
        FALSE,
        FALSE,
        FALSE,
        5
    );

INSERT INTO student_section_enrollment_status (code, name, sort_order, allow_linear_shift) VALUES
    ('REGISTERED', 'Registered', 1, TRUE),
    ('WAITLISTED', 'Waitlisted', 2, TRUE),
    ('DROPPED', 'Dropped', 3, FALSE),
    ('WITHDRAWN', 'Withdrawn', 4, FALSE),
    ('COMPLETED', 'Completed', 5, FALSE),
    ('CANCELLED', 'Cancelled', 6, FALSE);

INSERT INTO student_section_grade_type (code, name, sort_order) VALUES
    ('MIDTERM', 'Midterm', 1),
    ('FINAL', 'Final', 2);

INSERT INTO grade_mark (code, name, quality_points, earns_credit, counts_in_gpa, sort_order) VALUES
    ('A', 'A', 4.00, TRUE, TRUE, 1),
    ('A-', 'A-', 3.70, TRUE, TRUE, 2),
    ('B+', 'B+', 3.30, TRUE, TRUE, 3),
    ('B', 'B', 3.00, TRUE, TRUE, 4),
    ('B-', 'B-', 2.70, TRUE, TRUE, 5),
    ('C+', 'C+', 2.30, TRUE, TRUE, 6),
    ('C', 'C', 2.00, TRUE, TRUE, 7),
    ('C-', 'C-', 1.70, TRUE, TRUE, 8),
    ('D+', 'D+', 1.30, TRUE, TRUE, 9),
    ('D', 'D', 1.00, TRUE, TRUE, 10),
    ('D-', 'D-', 0.70, TRUE, TRUE, 11),
    ('F', 'Failed', 0.00, FALSE, TRUE, 12),
    ('P', 'Pass', NULL, TRUE, FALSE, 13),
    ('W', 'Withdrawn', NULL, FALSE, FALSE, 14),
    ('I', 'Incomplete', NULL, FALSE, FALSE, 15),
    ('AU', 'Audit', NULL, FALSE, FALSE, 16);
