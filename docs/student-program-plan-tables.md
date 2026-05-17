# Student Program Plan Tables

This documents the database shape for 9 tables: `academic_career`, `academic_career_registration_division`, `student_academic_career`, `student_program`, `student_program_request`, `student_academic_plan`, `student_academic_plan_year`, `student_academic_plan_term`, `student_academic_plan_course`. It supports:

- Stores academic career records
- Stores academic career registration division records
- Stores student academic career records
- Stores a student's active or historical program assignments
- Stores student requests to add or change programs
- Stores academic plan drafts for student programs
- Stores year buckets within an academic plan
- Stores term buckets within an academic plan year
- Stores planned courses within an academic plan term

Implemented by Flyway migration:
`api/src/main/resources/db/migration/V12__create_student_program_plan_tables.sql`.

## Tables

### `academic_career`

Stores academic career records.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `academic_career_id` | `BIGINT` | Yes | Identity primary key |
| `code` | `VARCHAR(50)` | Yes | Unique |
| `name` | `VARCHAR(100)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `sort_order` | `INT` | Yes | Defaults to `0` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `academic_career_registration_division`

Stores academic career registration division records.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `academic_career_registration_division_id` | `BIGINT` | Yes | Identity primary key |
| `academic_career_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_career(academic_career_id)` |
| `academic_division_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_division(academic_division_id)` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |

### `student_academic_career`

Stores student academic career records.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_academic_career_id` | `BIGINT` | Yes | Identity primary key |
| `student_id` | `BIGINT` | Yes | References `student(student_id)` |
| `academic_career_id` | `BIGINT` | Yes | References `academic_career(academic_career_id)` |
| `status` | `VARCHAR(30)` | Yes | Defaults to `'ACTIVE'` |
| `effective_start_date` | `DATE` | Yes |  |
| `effective_end_date` | `DATE` | No |  |
| `primary_career` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `entry_reason` | `VARCHAR(50)` | No |  |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `created_by_user_id` | `BIGINT` | No | References `users(id)` |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `student_program`

Stores a student's active or historical program assignments.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_program_id` | `BIGINT` | Yes | Identity primary key |
| `student_id` | `BIGINT` | Yes | Part of unique constraint; References `student(student_id)` |
| `program_version_id` | `BIGINT` | Yes | Part of unique constraint; References `program_version(program_version_id)` |
| `student_academic_career_id` | `BIGINT` | No | References `student_academic_career(student_academic_career_id)` |
| `status` | `VARCHAR(30)` | Yes | Defaults to `'ACTIVE'` |
| `declared_date` | `DATE` | No |  |
| `completed_date` | `DATE` | No |  |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `student_program_request`

Stores student requests to add or change programs.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_program_request_id` | `BIGINT` | Yes | Identity primary key |
| `student_id` | `BIGINT` | Yes | References `student(student_id)` |
| `program_id` | `BIGINT` | Yes | References `program(program_id)` |
| `student_program_id` | `BIGINT` | No | References `student_program(student_program_id)` |
| `requested_program_version_id` | `BIGINT` | Yes | References `program_version(program_version_id)` |
| `department_approved_program_version_id` | `BIGINT` | No | References `program_version(program_version_id)` |
| `status` | `VARCHAR(30)` | Yes | Defaults to `'REQUESTED'` |
| `requested_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP` |
| `department_reviewed_at` | `TIMESTAMP` | No |  |
| `department_reviewed_by_user_id` | `BIGINT` | No | References `users(id)` |
| `department_signature_name` | `VARCHAR(255)` | No |  |
| `department_signature_email` | `VARCHAR(255)` | No |  |
| `department_comment` | `VARCHAR(1000)` | No |  |
| `admin_reviewed_at` | `TIMESTAMP` | No |  |
| `admin_reviewed_by_user_id` | `BIGINT` | No | References `users(id)` |
| `admin_signature_name` | `VARCHAR(255)` | No |  |
| `admin_signature_email` | `VARCHAR(255)` | No |  |
| `admin_comment` | `VARCHAR(1000)` | No |  |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `student_academic_plan`

Stores academic plan drafts for student programs.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_academic_plan_id` | `BIGINT` | Yes | Identity primary key |
| `student_id` | `BIGINT` | Yes | References `student(student_id)` |
| `name` | `VARCHAR(255)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `student_academic_plan_year`

Stores year buckets within an academic plan.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_academic_plan_year_id` | `BIGINT` | Yes | Identity primary key |
| `student_academic_plan_id` | `BIGINT` | Yes | Part of unique constraint; References `student_academic_plan(student_academic_plan_id)` |
| `label` | `VARCHAR(100)` | Yes | Part of unique constraint |
| `sort_order` | `INT` | Yes | Part of unique constraint |
| `can_remove` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `student_academic_plan_term`

Stores term buckets within an academic plan year.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_academic_plan_term_id` | `BIGINT` | Yes | Identity primary key |
| `student_academic_plan_year_id` | `BIGINT` | Yes | Part of unique constraint; References `student_academic_plan_year(student_academic_plan_year_id)` |
| `label` | `VARCHAR(100)` | Yes | Part of unique constraint |
| `sort_order` | `INT` | Yes | Part of unique constraint |
| `is_complete` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `student_academic_plan_course`

Stores planned courses within an academic plan term.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_academic_plan_course_id` | `BIGINT` | Yes | Identity primary key |
| `student_academic_plan_term_id` | `BIGINT` | Yes | References `student_academic_plan_term(student_academic_plan_term_id)` |
| `course_id` | `BIGINT` | No | References `course(course_id)` |
| `student_program_id` | `BIGINT` | No | References `student_program(student_program_id)` |
| `requirement_id` | `BIGINT` | No | References `requirement(requirement_id)` |
| `status` | `VARCHAR(30)` | Yes | Defaults to `'PLANNED'` |
| `credits` | `DECIMAL(4,2)` | No |  |
| `planner_bucket_code` | `VARCHAR(30)` | No |  |
| `planner_bucket_label` | `VARCHAR(100)` | No |  |
| `placeholder_type` | `VARCHAR(40)` | No |  |
| `placeholder_label` | `VARCHAR(120)` | No |  |
| `placeholder_subject_code` | `VARCHAR(20)` | No |  |
| `placeholder_department_id` | `BIGINT` | No | References `academic_department(department_id)` |
| `placeholder_minimum_course_number` | `INT` | No |  |
| `placeholder_maximum_course_number` | `INT` | No |  |
| `sort_order` | `INT` | Yes | Defaults to `0` |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

## SQL

```sql
INSERT INTO academic_division (code, name, active, sort_order)
VALUES ('SEMINARY', 'Seminary', TRUE, 3)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    active = EXCLUDED.active,
    sort_order = EXCLUDED.sort_order;

CREATE TABLE academic_career (
    academic_career_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_academic_career_code
        UNIQUE (code)
);

INSERT INTO academic_career (code, name, active, sort_order)
VALUES
    ('UNDERGRADUATE', 'Undergraduate', TRUE, 1),
    ('GRADUATE', 'Graduate', TRUE, 2),
    ('SEMINARY', 'Seminary', TRUE, 3)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    active = EXCLUDED.active,
    sort_order = EXCLUDED.sort_order;

CREATE TABLE academic_career_registration_division (
    academic_career_registration_division_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    academic_career_id BIGINT NOT NULL,
    academic_division_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_academic_career_registration_division_career
        FOREIGN KEY (academic_career_id)
            REFERENCES academic_career(academic_career_id) ON DELETE CASCADE,

    CONSTRAINT fk_academic_career_registration_division_division
        FOREIGN KEY (academic_division_id)
            REFERENCES academic_division(academic_division_id) ON DELETE CASCADE,

    CONSTRAINT uq_academic_career_registration_division
        UNIQUE (academic_career_id, academic_division_id)
);

INSERT INTO academic_career_registration_division (academic_career_id, academic_division_id)
SELECT career.academic_career_id, division.academic_division_id
FROM (
    VALUES
        ('UNDERGRADUATE', 'UNDERGRADUATE'),
        ('GRADUATE', 'UNDERGRADUATE'),
        ('GRADUATE', 'GRADUATE'),
        ('SEMINARY', 'UNDERGRADUATE'),
        ('SEMINARY', 'GRADUATE'),
        ('SEMINARY', 'SEMINARY')
) AS allowed(academic_career_code, academic_division_code)
JOIN academic_career career ON career.code = allowed.academic_career_code
JOIN academic_division division ON division.code = allowed.academic_division_code
ON CONFLICT ON CONSTRAINT uq_academic_career_registration_division DO NOTHING;

CREATE TABLE student_academic_career (
    student_academic_career_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL,
    academic_career_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    effective_start_date DATE NOT NULL,
    effective_end_date DATE NULL,
    primary_career BOOLEAN NOT NULL DEFAULT FALSE,
    entry_reason VARCHAR(50) NULL,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id BIGINT NULL,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_student_academic_career_student
        FOREIGN KEY (student_id)
            REFERENCES student(student_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_academic_career_career
        FOREIGN KEY (academic_career_id)
            REFERENCES academic_career(academic_career_id),

    CONSTRAINT fk_student_academic_career_created_by
        FOREIGN KEY (created_by_user_id)
            REFERENCES users(id),

    CONSTRAINT fk_student_academic_career_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT chk_student_academic_career_status
        CHECK (status IN (
            'ACTIVE',
            'INTENT_TO_GRADUATE',
            'GRADUATED',
            'WITHDRAWN',
            'DISMISSED',
            'LEAVE_OF_ABSENCE'
        )),

    CONSTRAINT chk_student_academic_career_dates
        CHECK (effective_end_date IS NULL OR effective_end_date >= effective_start_date)
);

CREATE TABLE student_program (
    student_program_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL,
    program_version_id BIGINT NOT NULL,
    student_academic_career_id BIGINT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    declared_date DATE NULL,
    completed_date DATE NULL,
    notes VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_student_program_student
        FOREIGN KEY (student_id)
            REFERENCES student(student_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_program_program_version
        FOREIGN KEY (program_version_id)
            REFERENCES program_version(program_version_id),

    CONSTRAINT fk_student_program_academic_career
        FOREIGN KEY (student_academic_career_id)
            REFERENCES student_academic_career(student_academic_career_id) ON DELETE SET NULL,

    CONSTRAINT fk_student_program_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT uq_student_program_version
        UNIQUE (student_id, program_version_id),

    CONSTRAINT chk_student_program_status
        CHECK (status IN ('EXPLORING', 'ACTIVE', 'COMPLETED', 'REMOVED')),

    CONSTRAINT chk_student_program_completed_date
        CHECK (
            completed_date IS NULL
            OR declared_date IS NULL
            OR completed_date >= declared_date
        )
);

CREATE TABLE student_program_request (
    student_program_request_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL,
    program_id BIGINT NOT NULL,
    student_program_id BIGINT NULL,
    requested_program_version_id BIGINT NOT NULL,
    department_approved_program_version_id BIGINT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    department_reviewed_at TIMESTAMP NULL,
    department_reviewed_by_user_id BIGINT NULL,
    department_signature_name VARCHAR(255) NULL,
    department_signature_email VARCHAR(255) NULL,
    department_comment VARCHAR(1000) NULL,
    admin_reviewed_at TIMESTAMP NULL,
    admin_reviewed_by_user_id BIGINT NULL,
    admin_signature_name VARCHAR(255) NULL,
    admin_signature_email VARCHAR(255) NULL,
    admin_comment VARCHAR(1000) NULL,
    notes VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_student_program_request_student
        FOREIGN KEY (student_id)
            REFERENCES student(student_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_program_request_program
        FOREIGN KEY (program_id)
            REFERENCES program(program_id),

    CONSTRAINT fk_student_program_request_student_program
        FOREIGN KEY (student_program_id)
            REFERENCES student_program(student_program_id) ON DELETE SET NULL,

    CONSTRAINT fk_student_program_request_requested_program_version
        FOREIGN KEY (requested_program_version_id)
            REFERENCES program_version(program_version_id),

    CONSTRAINT fk_student_program_request_department_approved_program_version
        FOREIGN KEY (department_approved_program_version_id)
            REFERENCES program_version(program_version_id),

    CONSTRAINT fk_student_program_request_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT fk_student_program_request_department_reviewed_by
        FOREIGN KEY (department_reviewed_by_user_id)
            REFERENCES users(id),

    CONSTRAINT fk_student_program_request_admin_reviewed_by
        FOREIGN KEY (admin_reviewed_by_user_id)
            REFERENCES users(id),

    CONSTRAINT chk_student_program_request_status
        CHECK (status IN ('REQUESTED', 'DEPARTMENT_APPROVED', 'ADMIN_APPROVED', 'REJECTED', 'CANCELLED')),

    CONSTRAINT chk_student_program_request_department_version_required
        CHECK (
            status NOT IN ('DEPARTMENT_APPROVED', 'ADMIN_APPROVED')
            OR department_approved_program_version_id IS NOT NULL
        ),

    CONSTRAINT chk_student_program_request_admin_review_required
        CHECK (
            status <> 'ADMIN_APPROVED'
            OR admin_reviewed_at IS NOT NULL
        ),

    CONSTRAINT chk_student_program_request_rejection_review_required
        CHECK (
            status <> 'REJECTED'
            OR admin_reviewed_at IS NOT NULL
            OR department_reviewed_at IS NOT NULL
        )
);

CREATE TABLE student_academic_plan (
    student_academic_plan_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL,

    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_student_academic_plan_student
        FOREIGN KEY (student_id)
            REFERENCES student(student_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_academic_plan_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id)
);

CREATE TABLE student_academic_plan_year (
    student_academic_plan_year_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_academic_plan_id BIGINT NOT NULL,

    label VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL,
    can_remove BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_student_academic_plan_year_plan
        FOREIGN KEY (student_academic_plan_id)
            REFERENCES student_academic_plan(student_academic_plan_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_academic_plan_year_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT uq_student_academic_plan_year_sort
        UNIQUE (student_academic_plan_id, sort_order),

    CONSTRAINT uq_student_academic_plan_year_label
        UNIQUE (student_academic_plan_id, label),

    CONSTRAINT chk_student_academic_plan_year_sort
        CHECK (sort_order >= 0)
);

CREATE TABLE student_academic_plan_term (
    student_academic_plan_term_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_academic_plan_year_id BIGINT NOT NULL,

    label VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_student_academic_plan_term_year
        FOREIGN KEY (student_academic_plan_year_id)
            REFERENCES student_academic_plan_year(student_academic_plan_year_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_academic_plan_term_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT uq_student_academic_plan_term_sort
        UNIQUE (student_academic_plan_year_id, sort_order),

    CONSTRAINT uq_student_academic_plan_term_label
        UNIQUE (student_academic_plan_year_id, label),

    CONSTRAINT chk_student_academic_plan_term_sort
        CHECK (sort_order >= 0)
);

CREATE TABLE student_academic_plan_course (
    student_academic_plan_course_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_academic_plan_term_id BIGINT NOT NULL,
    course_id BIGINT NULL,
    student_program_id BIGINT NULL,
    requirement_id BIGINT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    credits DECIMAL(4,2) NULL,
    planner_bucket_code VARCHAR(30) NULL,
    planner_bucket_label VARCHAR(100) NULL,
    placeholder_type VARCHAR(40) NULL,
    placeholder_label VARCHAR(120) NULL,
    placeholder_subject_code VARCHAR(20) NULL,
    placeholder_department_id BIGINT NULL,
    placeholder_minimum_course_number INT NULL,
    placeholder_maximum_course_number INT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    notes VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_student_academic_plan_course_term
        FOREIGN KEY (student_academic_plan_term_id)
            REFERENCES student_academic_plan_term(student_academic_plan_term_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_academic_plan_course_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT fk_student_academic_plan_course_course
        FOREIGN KEY (course_id)
            REFERENCES course(course_id),

    CONSTRAINT fk_student_academic_plan_course_student_program
        FOREIGN KEY (student_program_id)
            REFERENCES student_program(student_program_id) ON DELETE SET NULL,

    CONSTRAINT fk_student_academic_plan_course_requirement
        FOREIGN KEY (requirement_id)
            REFERENCES requirement(requirement_id) ON DELETE SET NULL,

    CONSTRAINT fk_student_academic_plan_course_placeholder_department
        FOREIGN KEY (placeholder_department_id)
            REFERENCES academic_department(department_id) ON DELETE SET NULL,

    CONSTRAINT chk_student_academic_plan_course_status
        CHECK (status IN ('PLANNED')),

    CONSTRAINT chk_student_academic_plan_course_credits
        CHECK (credits IS NULL OR credits >= 0),

    CONSTRAINT chk_student_academic_plan_course_planner_bucket_code
        CHECK (
            planner_bucket_code IS NULL
            OR planner_bucket_code IN ('FULL_TERM', 'SESSION_A', 'SESSION_B')
        ),

    CONSTRAINT chk_student_academic_plan_course_sort
        CHECK (sort_order >= 0),

    CONSTRAINT chk_student_academic_plan_course_placeholder_type
        CHECK (placeholder_type IS NULL OR placeholder_type IN ('DEPARTMENT_ELECTIVE', 'ELECTIVE')),

    CONSTRAINT chk_student_academic_plan_course_placeholder_min_course_number
        CHECK (placeholder_minimum_course_number IS NULL OR placeholder_minimum_course_number >= 0),

    CONSTRAINT chk_student_academic_plan_course_placeholder_max_course_number
        CHECK (placeholder_maximum_course_number IS NULL OR placeholder_maximum_course_number >= 0),

    CONSTRAINT chk_student_academic_plan_course_placeholder_course_number_range
        CHECK (
            placeholder_minimum_course_number IS NULL
            OR placeholder_maximum_course_number IS NULL
            OR placeholder_maximum_course_number >= placeholder_minimum_course_number
        ),

    CONSTRAINT chk_student_academic_plan_course_course_or_placeholder
        CHECK (
            course_id IS NOT NULL
            OR (
                placeholder_type IS NOT NULL
                AND placeholder_label IS NOT NULL
            )
        )
);

CREATE INDEX idx_student_program_student
    ON student_program (student_id);

CREATE INDEX idx_student_program_program_version
    ON student_program (program_version_id);

CREATE INDEX idx_student_program_academic_career
    ON student_program (student_academic_career_id);

CREATE INDEX idx_student_program_status
    ON student_program (status);

CREATE INDEX idx_student_program_updated_by
    ON student_program (updated_by_user_id);

CREATE INDEX idx_student_program_request_student
    ON student_program_request (student_id);

CREATE INDEX idx_student_program_request_program
    ON student_program_request (program_id);

CREATE INDEX idx_student_program_request_student_program
    ON student_program_request (student_program_id);

CREATE INDEX idx_student_program_request_requested_program_version
    ON student_program_request (requested_program_version_id);

CREATE INDEX idx_student_program_request_department_approved_program_version
    ON student_program_request (department_approved_program_version_id);

CREATE INDEX idx_student_program_request_status
    ON student_program_request (status);

CREATE INDEX idx_student_program_request_requested_at
    ON student_program_request (requested_at);

CREATE INDEX idx_student_program_request_updated_by
    ON student_program_request (updated_by_user_id);

CREATE INDEX idx_student_program_request_department_reviewed_by
    ON student_program_request (department_reviewed_by_user_id);

CREATE INDEX idx_student_program_request_admin_reviewed_by
    ON student_program_request (admin_reviewed_by_user_id);

CREATE UNIQUE INDEX uq_student_program_request_open_program
    ON student_program_request (student_id, program_id)
    WHERE status IN ('REQUESTED', 'DEPARTMENT_APPROVED');

CREATE INDEX idx_academic_career_active_sort
    ON academic_career (active, sort_order);

CREATE INDEX idx_academic_career_registration_division_career
    ON academic_career_registration_division (academic_career_id);

CREATE INDEX idx_academic_career_registration_division_division
    ON academic_career_registration_division (academic_division_id);

CREATE INDEX idx_student_academic_career_student
    ON student_academic_career (student_id);

CREATE INDEX idx_student_academic_career_career
    ON student_academic_career (academic_career_id);

CREATE INDEX idx_student_academic_career_status
    ON student_academic_career (status);

CREATE INDEX idx_student_academic_career_dates
    ON student_academic_career (effective_start_date, effective_end_date);

CREATE INDEX idx_student_academic_career_primary
    ON student_academic_career (primary_career);

CREATE INDEX idx_student_academic_career_created_by
    ON student_academic_career (created_by_user_id);

CREATE INDEX idx_student_academic_career_updated_by
    ON student_academic_career (updated_by_user_id);

CREATE UNIQUE INDEX uq_student_academic_career_student_career
    ON student_academic_career (student_id, academic_career_id);

CREATE UNIQUE INDEX uq_student_academic_career_primary_current
    ON student_academic_career (student_id)
    WHERE status = 'ACTIVE' AND effective_end_date IS NULL AND primary_career = TRUE;

CREATE INDEX idx_student_academic_plan_student
    ON student_academic_plan (student_id);

CREATE INDEX idx_student_academic_plan_updated_by
    ON student_academic_plan (updated_by_user_id);

CREATE UNIQUE INDEX uq_student_academic_plan_active
    ON student_academic_plan (student_id)
    WHERE active = TRUE;

CREATE INDEX idx_student_academic_plan_year_plan
    ON student_academic_plan_year (student_academic_plan_id);

CREATE INDEX idx_student_academic_plan_year_updated_by
    ON student_academic_plan_year (updated_by_user_id);

CREATE INDEX idx_student_academic_plan_term_year
    ON student_academic_plan_term (student_academic_plan_year_id);

CREATE INDEX idx_student_academic_plan_term_updated_by
    ON student_academic_plan_term (updated_by_user_id);

CREATE INDEX idx_student_academic_plan_course_term
    ON student_academic_plan_course (student_academic_plan_term_id);

CREATE INDEX idx_student_academic_plan_course_course
    ON student_academic_plan_course (course_id);

CREATE INDEX idx_student_academic_plan_course_student_program
    ON student_academic_plan_course (student_program_id);

CREATE INDEX idx_student_academic_plan_course_requirement
    ON student_academic_plan_course (requirement_id);

CREATE INDEX idx_student_academic_plan_course_placeholder_department
    ON student_academic_plan_course (placeholder_department_id);

CREATE INDEX idx_student_academic_plan_course_updated_by
    ON student_academic_plan_course (updated_by_user_id);

CREATE TRIGGER trg_student_program_updated_at
    BEFORE UPDATE ON student_program
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_program_request_updated_at
    BEFORE UPDATE ON student_program_request
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_academic_career_updated_at
    BEFORE UPDATE ON academic_career
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_academic_career_updated_at
    BEFORE UPDATE ON student_academic_career
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_academic_plan_updated_at
    BEFORE UPDATE ON student_academic_plan
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_academic_plan_year_updated_at
    BEFORE UPDATE ON student_academic_plan_year
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_academic_plan_term_updated_at
    BEFORE UPDATE ON student_academic_plan_term
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_academic_plan_course_updated_at
    BEFORE UPDATE ON student_academic_plan_course
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

## Notes

- Keep this document aligned with `api/src/main/resources/db/migration/V12__create_student_program_plan_tables.sql`; the SQL block is included so reviewers can compare the table summary against the migration.
- Reference and seed data inserted by the migration are part of the migration contract, but the tables above describe the stored shape.
