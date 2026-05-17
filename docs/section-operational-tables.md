# Section Operational Tables

This documents the database shape for 6 tables: `course_section`, `course_section_instructor`, `course_section_meeting`, `student_section_enrollment`, `student_section_grade`, `student_section_enrollment_event`. It supports:

- Stores schedulable sections for a course offering
- Assigns instructors to course sections
- Stores section meeting times and locations
- Stores student enrollment records for course sections
- Stores student grades for section enrollments
- Stores enrollment audit/history events

Implemented by Flyway migration:
`api/src/main/resources/db/migration/V8__create_section_operational_tables.sql`.

## Tables

### `course_section`

Stores schedulable sections for a course offering.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `section_id` | `BIGINT` | Yes | Identity primary key |
| `course_offering_id` | `BIGINT` | Yes | Part of unique constraint; References `course_offering_sub_term(course_offering_id, sub_term_id)` |
| `sub_term_id` | `BIGINT` | Yes | Part of unique constraint; References `course_offering_sub_term(course_offering_id, sub_term_id)` |
| `academic_division_id` | `BIGINT` | No | References `academic_division(academic_division_id)` |
| `section_letter` | `VARCHAR(5)` | Yes | Part of unique constraint |
| `title` | `VARCHAR(255)` | No |  |
| `is_honors` | `BOOLEAN` | Yes | Part of unique constraint; Defaults to `FALSE` |
| `course_section_status_id` | `BIGINT` | Yes | References `course_section_status(course_section_status_id)` |
| `delivery_mode_id` | `BIGINT` | Yes | References `delivery_mode(delivery_mode_id)` |
| `grading_basis_id` | `BIGINT` | Yes | References `grading_basis(grading_basis_id)` |
| `credits` | `DECIMAL(4,2)` | Yes |  |
| `capacity` | `INT` | Yes | Defaults to `0` |
| `hard_capacity` | `INT` | No |  |
| `waitlist_allowed` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `start_date` | `DATE` | No |  |
| `end_date` | `DATE` | No |  |
| `parent_section_id` | `BIGINT` | No | References `course_section(section_id)` |
| `linked_group_code` | `VARCHAR(50)` | No |  |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `course_section_instructor`

Assigns instructors to course sections.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `course_section_instructor_id` | `BIGINT` | Yes | Identity primary key |
| `section_id` | `BIGINT` | Yes | Part of unique constraint; References `course_section(section_id)` |
| `instructor_user_id` | `BIGINT` | Yes | Part of unique constraint; References `users(id)` |
| `instructional_assignment_role_id` | `BIGINT` | Yes | References `instructional_assignment_role(instructional_assignment_role_id)` |
| `can_view_grades` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `can_manage_grades` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `created_by_user_id` | `BIGINT` | No | References `users(id)` |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `course_section_meeting`

Stores section meeting times and locations.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `section_meeting_id` | `BIGINT` | Yes | Identity primary key |
| `section_id` | `BIGINT` | Yes | Part of unique constraint; References `course_section(section_id)` |
| `section_meeting_type_id` | `BIGINT` | Yes | References `section_meeting_type(section_meeting_type_id)` |
| `day_of_week` | `SMALLINT` | No |  |
| `start_time` | `TIME` | No |  |
| `end_time` | `TIME` | No |  |
| `building` | `VARCHAR(100)` | No |  |
| `room` | `VARCHAR(50)` | No |  |
| `start_date` | `DATE` | No |  |
| `end_date` | `DATE` | No |  |
| `sequence_number` | `INT` | Yes | Part of unique constraint; Defaults to `1` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `student_section_enrollment`

Stores student enrollment records for course sections.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_section_enrollment_id` | `BIGINT` | Yes | Identity primary key |
| `student_id` | `BIGINT` | Yes | Part of unique constraint; References `student(student_id)` |
| `section_id` | `BIGINT` | Yes | Part of unique constraint; References `course_section(section_id)` |
| `student_section_enrollment_status_id` | `BIGINT` | Yes | References `student_section_enrollment_status(student_section_enrollment_status_id)` |
| `grading_basis_id` | `BIGINT` | Yes | References `grading_basis(grading_basis_id)` |
| `enrollment_date` | `DATE` | Yes | Defaults to `CURRENT_DATE` |
| `registered_at` | `TIMESTAMP` | No |  |
| `waitlisted_at` | `TIMESTAMP` | No |  |
| `drop_date` | `DATE` | No |  |
| `withdraw_date` | `DATE` | No |  |
| `status_changed_at` | `TIMESTAMP` | No |  |
| `status_changed_by_user_id` | `BIGINT` | No | References `users(id)` |
| `credits_attempted` | `DECIMAL(4,2)` | No |  |
| `credits_earned` | `DECIMAL(4,2)` | No |  |
| `waitlist_position` | `INT` | No |  |
| `include_in_gpa` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `repeat_code` | `VARCHAR(30)` | No |  |
| `capacity_override` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `manual_add_reason` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `student_section_grade`

Stores student grades for section enrollments.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_section_grade_id` | `BIGINT` | Yes | Identity primary key |
| `student_section_enrollment_id` | `BIGINT` | Yes | References `student_section_enrollment(student_section_enrollment_id)` |
| `student_section_grade_type_id` | `BIGINT` | Yes | References `student_section_grade_type(student_section_grade_type_id)` |
| `grade_mark_id` | `BIGINT` | Yes | References `grade_mark(grade_mark_id)` |
| `previous_grade_mark_id` | `BIGINT` | No | References `grade_mark(grade_mark_id)` |
| `changed_from_grade_id` | `BIGINT` | No | References `student_section_grade(student_section_grade_id)` |
| `change_reason` | `VARCHAR(1000)` | No |  |
| `posted_by_user_id` | `BIGINT` | No | References `users(id)` |
| `is_current` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `posted_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `student_section_enrollment_event`

Stores enrollment audit/history events.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_section_enrollment_event_id` | `BIGINT` | Yes | Identity primary key |
| `student_section_enrollment_id` | `BIGINT` | Yes | References `student_section_enrollment(student_section_enrollment_id)` |
| `event_type` | `VARCHAR(50)` | Yes |  |
| `from_student_section_enrollment_status_id` | `BIGINT` | No | References `student_section_enrollment_status(student_section_enrollment_status_id)` |
| `to_student_section_enrollment_status_id` | `BIGINT` | No | References `student_section_enrollment_status(student_section_enrollment_status_id)` |
| `actor_user_id` | `BIGINT` | No | References `users(id)` |
| `reason` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |

## SQL

```sql
CREATE TABLE course_section (
    section_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_offering_id BIGINT NOT NULL,
    sub_term_id BIGINT NOT NULL,
    academic_division_id BIGINT NULL,

    section_letter VARCHAR(5) NOT NULL,
    title VARCHAR(255) NULL,
    is_honors BOOLEAN NOT NULL DEFAULT FALSE,

    course_section_status_id BIGINT NOT NULL,
    delivery_mode_id BIGINT NOT NULL,
    grading_basis_id BIGINT NOT NULL,

    credits DECIMAL(4,2) NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    hard_capacity INT NULL,
    waitlist_allowed BOOLEAN NOT NULL DEFAULT FALSE,

    start_date DATE NULL,
    end_date DATE NULL,

    parent_section_id BIGINT NULL,
    linked_group_code VARCHAR(50) NULL,
    notes VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_section_offering_sub_term
        FOREIGN KEY (course_offering_id, sub_term_id)
            REFERENCES course_offering_sub_term(course_offering_id, sub_term_id),

    CONSTRAINT fk_course_section_status
        FOREIGN KEY (course_section_status_id)
            REFERENCES course_section_status(course_section_status_id),

    CONSTRAINT fk_course_section_academic_division
        FOREIGN KEY (academic_division_id) REFERENCES academic_division(academic_division_id),

    CONSTRAINT fk_course_section_delivery_mode
        FOREIGN KEY (delivery_mode_id) REFERENCES delivery_mode(delivery_mode_id),

    CONSTRAINT fk_course_section_grading_basis
        FOREIGN KEY (grading_basis_id) REFERENCES grading_basis(grading_basis_id),

    CONSTRAINT fk_course_section_parent
        FOREIGN KEY (parent_section_id) REFERENCES course_section(section_id),

    CONSTRAINT uq_course_section_offering_sub_term_letter
        UNIQUE (course_offering_id, sub_term_id, section_letter, is_honors),

    CONSTRAINT chk_course_section_credits
        CHECK (credits >= 0),

    CONSTRAINT chk_course_section_capacity
        CHECK (capacity >= 0),

    CONSTRAINT chk_course_section_hard_capacity
        CHECK (hard_capacity IS NULL OR hard_capacity >= capacity),

    CONSTRAINT chk_course_section_date_range
        CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

CREATE TABLE course_section_instructor (
    course_section_instructor_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    section_id BIGINT NOT NULL,
    instructor_user_id BIGINT NOT NULL,
    instructional_assignment_role_id BIGINT NOT NULL,
    can_view_grades BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_grades BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id BIGINT NULL,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_course_section_instructor_section
        FOREIGN KEY (section_id)
            REFERENCES course_section(section_id) ON DELETE CASCADE,

    CONSTRAINT fk_course_section_instructor_user
        FOREIGN KEY (instructor_user_id) REFERENCES users(id),

    CONSTRAINT fk_course_section_instructor_role
        FOREIGN KEY (instructional_assignment_role_id)
            REFERENCES instructional_assignment_role(instructional_assignment_role_id),

    CONSTRAINT fk_course_section_instructor_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(id),

    CONSTRAINT fk_course_section_instructor_updated_by
        FOREIGN KEY (updated_by_user_id) REFERENCES users(id),

    CONSTRAINT uq_course_section_instructor_unique
        UNIQUE (section_id, instructor_user_id)
);

CREATE TABLE course_section_meeting (
    section_meeting_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    section_id BIGINT NOT NULL,
    section_meeting_type_id BIGINT NOT NULL,

    day_of_week SMALLINT NULL,
    start_time TIME NULL,
    end_time TIME NULL,

    building VARCHAR(100) NULL,
    room VARCHAR(50) NULL,

    start_date DATE NULL,
    end_date DATE NULL,

    sequence_number INT NOT NULL DEFAULT 1,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_section_meeting_section
        FOREIGN KEY (section_id)
            REFERENCES course_section(section_id) ON DELETE CASCADE,

    CONSTRAINT fk_course_section_meeting_type
        FOREIGN KEY (section_meeting_type_id)
            REFERENCES section_meeting_type(section_meeting_type_id),

    CONSTRAINT chk_course_section_meeting_day_of_week
        CHECK (day_of_week IS NULL OR day_of_week BETWEEN 1 AND 7),

    CONSTRAINT chk_course_section_meeting_time_range
        CHECK (
            start_time IS NULL
            OR end_time IS NULL
            OR start_time < end_time
        ),

    CONSTRAINT chk_course_section_meeting_date_range
        CHECK (
            start_date IS NULL
            OR end_date IS NULL
            OR start_date <= end_date
        ),

    CONSTRAINT uq_course_section_meeting_sequence
        UNIQUE (section_id, sequence_number)
);

CREATE TABLE student_section_enrollment (
    student_section_enrollment_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    student_section_enrollment_status_id BIGINT NOT NULL,
    grading_basis_id BIGINT NOT NULL,

    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    registered_at TIMESTAMP NULL,
    waitlisted_at TIMESTAMP NULL,
    drop_date DATE NULL,
    withdraw_date DATE NULL,
    status_changed_at TIMESTAMP NULL,
    status_changed_by_user_id BIGINT NULL,

    credits_attempted DECIMAL(4,2) NULL,
    credits_earned DECIMAL(4,2) NULL,
    waitlist_position INT NULL,

    include_in_gpa BOOLEAN NOT NULL DEFAULT TRUE,
    repeat_code VARCHAR(30) NULL,
    capacity_override BOOLEAN NOT NULL DEFAULT FALSE,
    manual_add_reason VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_section_enrollment_student
        FOREIGN KEY (student_id) REFERENCES student(student_id),

    CONSTRAINT fk_student_section_enrollment_section
        FOREIGN KEY (section_id) REFERENCES course_section(section_id),

    CONSTRAINT fk_student_section_enrollment_status
        FOREIGN KEY (student_section_enrollment_status_id)
            REFERENCES student_section_enrollment_status(student_section_enrollment_status_id),

    CONSTRAINT fk_student_section_enrollment_grading_basis
        FOREIGN KEY (grading_basis_id) REFERENCES grading_basis(grading_basis_id),

    CONSTRAINT fk_student_section_enrollment_status_changed_by
        FOREIGN KEY (status_changed_by_user_id) REFERENCES users(id),

    CONSTRAINT uq_student_section_enrollment_student_section
        UNIQUE (student_id, section_id),

    CONSTRAINT chk_student_section_enrollment_drop_date
        CHECK (drop_date IS NULL OR drop_date >= enrollment_date),

    CONSTRAINT chk_student_section_enrollment_withdraw_date
        CHECK (withdraw_date IS NULL OR withdraw_date >= enrollment_date),

    CONSTRAINT chk_student_section_enrollment_drop_withdraw_exclusive
        CHECK (drop_date IS NULL OR withdraw_date IS NULL),

    CONSTRAINT chk_student_section_enrollment_credits_attempted
        CHECK (credits_attempted IS NULL OR credits_attempted >= 0),

    CONSTRAINT chk_student_section_enrollment_credits_earned
        CHECK (credits_earned IS NULL OR credits_earned >= 0),

    CONSTRAINT chk_student_section_enrollment_credits_consistency
        CHECK (
            credits_attempted IS NULL
            OR credits_earned IS NULL
            OR credits_earned <= credits_attempted
        ),

    CONSTRAINT chk_student_section_enrollment_waitlist_position
        CHECK (waitlist_position IS NULL OR waitlist_position > 0)
);

CREATE TABLE student_section_grade (
    student_section_grade_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_section_enrollment_id BIGINT NOT NULL,
    student_section_grade_type_id BIGINT NOT NULL,
    grade_mark_id BIGINT NOT NULL,
    previous_grade_mark_id BIGINT NULL,
    changed_from_grade_id BIGINT NULL,
    change_reason VARCHAR(1000) NULL,
    posted_by_user_id BIGINT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    posted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_section_grade_enrollment
        FOREIGN KEY (student_section_enrollment_id)
            REFERENCES student_section_enrollment(student_section_enrollment_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_section_grade_type
        FOREIGN KEY (student_section_grade_type_id)
            REFERENCES student_section_grade_type(student_section_grade_type_id),

    CONSTRAINT fk_student_section_grade_mark
        FOREIGN KEY (grade_mark_id) REFERENCES grade_mark(grade_mark_id),

    CONSTRAINT fk_student_section_grade_previous_mark
        FOREIGN KEY (previous_grade_mark_id) REFERENCES grade_mark(grade_mark_id),

    CONSTRAINT fk_student_section_grade_changed_from
        FOREIGN KEY (changed_from_grade_id) REFERENCES student_section_grade(student_section_grade_id),

    CONSTRAINT fk_student_section_grade_posted_by
        FOREIGN KEY (posted_by_user_id) REFERENCES users(id)
);

CREATE TABLE student_section_enrollment_event (
    student_section_enrollment_event_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_section_enrollment_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    from_student_section_enrollment_status_id BIGINT NULL,
    to_student_section_enrollment_status_id BIGINT NULL,
    actor_user_id BIGINT NULL,
    reason VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_section_enrollment_event_enrollment
        FOREIGN KEY (student_section_enrollment_id)
            REFERENCES student_section_enrollment(student_section_enrollment_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_section_enrollment_event_from_status
        FOREIGN KEY (from_student_section_enrollment_status_id)
            REFERENCES student_section_enrollment_status(student_section_enrollment_status_id),

    CONSTRAINT fk_student_section_enrollment_event_to_status
        FOREIGN KEY (to_student_section_enrollment_status_id)
            REFERENCES student_section_enrollment_status(student_section_enrollment_status_id),

    CONSTRAINT fk_student_section_enrollment_event_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX idx_course_section_offering_sub_term
    ON course_section (course_offering_id, sub_term_id);

CREATE INDEX idx_course_section_status
    ON course_section (course_section_status_id);

CREATE INDEX idx_course_section_division
    ON course_section (academic_division_id);

CREATE INDEX idx_course_section_dates
    ON course_section (start_date, end_date);

CREATE INDEX idx_course_section_instructor_user
    ON course_section_instructor (instructor_user_id);

CREATE INDEX idx_course_section_instructor_role
    ON course_section_instructor (instructional_assignment_role_id);

CREATE INDEX idx_course_section_instructor_updated_by
    ON course_section_instructor (updated_by_user_id);

CREATE INDEX idx_course_section_meeting_section
    ON course_section_meeting (section_id);

CREATE INDEX idx_student_section_enrollment_student
    ON student_section_enrollment (student_id);

CREATE INDEX idx_student_section_enrollment_section
    ON student_section_enrollment (section_id);

CREATE INDEX idx_student_section_enrollment_status
    ON student_section_enrollment (student_section_enrollment_status_id);

CREATE INDEX idx_student_section_enrollment_waitlist
    ON student_section_enrollment (section_id, waitlist_position)
    WHERE waitlist_position IS NOT NULL;

CREATE UNIQUE INDEX uq_student_section_enrollment_waitlist_position
    ON student_section_enrollment (section_id, waitlist_position)
    WHERE waitlist_position IS NOT NULL;

CREATE INDEX idx_student_section_grade_enrollment
    ON student_section_grade (student_section_enrollment_id);

CREATE INDEX idx_student_section_grade_type
    ON student_section_grade (student_section_grade_type_id);

CREATE INDEX idx_student_section_grade_mark
    ON student_section_grade (grade_mark_id);

CREATE INDEX idx_student_section_grade_previous_mark
    ON student_section_grade (previous_grade_mark_id);

CREATE INDEX idx_student_section_grade_changed_from
    ON student_section_grade (changed_from_grade_id);

CREATE INDEX idx_student_section_grade_posted_by
    ON student_section_grade (posted_by_user_id);

CREATE UNIQUE INDEX uq_student_section_grade_current
    ON student_section_grade (student_section_enrollment_id, student_section_grade_type_id)
    WHERE is_current = TRUE;

CREATE INDEX idx_student_section_enrollment_event_enrollment
    ON student_section_enrollment_event (student_section_enrollment_id);

CREATE INDEX idx_student_section_enrollment_event_actor
    ON student_section_enrollment_event (actor_user_id);

CREATE INDEX idx_student_section_enrollment_event_type
    ON student_section_enrollment_event (event_type);

CREATE TRIGGER trg_course_section_updated_at
    BEFORE UPDATE ON course_section
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_course_section_instructor_updated_at
    BEFORE UPDATE ON course_section_instructor
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_course_section_meeting_updated_at
    BEFORE UPDATE ON course_section_meeting
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_section_enrollment_updated_at
    BEFORE UPDATE ON student_section_enrollment
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_section_grade_updated_at
    BEFORE UPDATE ON student_section_grade
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

## Notes

- Keep this document aligned with `api/src/main/resources/db/migration/V8__create_section_operational_tables.sql`; the SQL block is included so reviewers can compare the table summary against the migration.
- Reference and seed data inserted by the migration are part of the migration contract, but the tables above describe the stored shape.
