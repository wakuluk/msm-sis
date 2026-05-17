# Catalog Tables

This documents the database shape for 15 tables: `academic_school`, `academic_department`, `academic_department_staff_role`, `academic_year_status`, `academic_sub_term_status`, `academic_division`, `academic_year`, `academic_subject`, `course`, `course_version`, `academic_sub_term`, `academic_term`, `academic_term_sub_term`, `course_offering`, `course_offering_sub_term`. It supports:

- Stores academic schools
- Stores departments within academic schools
- Assigns staff roles within academic departments
- Stores reference statuses for academic year
- Stores reference statuses for academic sub term
- Stores academic division records
- Stores academic-year calendar and lifecycle records
- Stores academic subject records
- Stores catalog course identities
- Stores versioned course catalog details
- Stores sub-terms within academic years
- Stores terms within academic years
- Maps sub-terms to academic terms
- Stores course offerings for an academic year
- Maps course offerings to sub-terms

Implemented by Flyway migration:
`api/src/main/resources/db/migration/V5__create_catalog_tables.sql`.

## Tables

### `academic_school`

Stores academic schools.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `school_id` | `BIGINT` | Yes | Identity primary key |
| `code` | `VARCHAR(20)` | Yes | Unique |
| `name` | `VARCHAR(255)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |

### `academic_department`

Stores departments within academic schools.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `department_id` | `BIGINT` | Yes | Identity primary key |
| `school_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_school(school_id)` |
| `code` | `VARCHAR(20)` | Yes | Part of unique constraint |
| `name` | `VARCHAR(255)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |

### `academic_department_staff_role`

Assigns staff roles within academic departments.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `academic_department_staff_role_id` | `BIGINT` | Yes | Identity primary key |
| `department_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_department(department_id)` |
| `staff_id` | `BIGINT` | Yes | Part of unique constraint; References `staff(id)` |
| `role_code` | `VARCHAR(50)` | Yes | Part of unique constraint |
| `start_date` | `DATE` | No |  |
| `end_date` | `DATE` | No |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `academic_year_status`

Stores reference statuses for academic year.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `year_status_id` | `BIGINT` | Yes | Identity primary key |
| `code` | `VARCHAR(50)` | Yes | Unique |
| `name` | `VARCHAR(100)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `sort_order` | `INT` | Yes |  |
| `allow_linear_shift` | `BOOLEAN` | Yes | Defaults to `TRUE` |

### `academic_sub_term_status`

Stores reference statuses for academic sub term.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `sub_term_status_id` | `BIGINT` | Yes | Identity primary key |
| `code` | `VARCHAR(50)` | Yes | Unique |
| `name` | `VARCHAR(100)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `sort_order` | `INT` | Yes |  |
| `allow_linear_shift` | `BOOLEAN` | Yes | Defaults to `TRUE` |

### `academic_division`

Stores academic division records.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `academic_division_id` | `BIGINT` | Yes | Identity primary key |
| `code` | `VARCHAR(50)` | Yes | Unique |
| `name` | `VARCHAR(100)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `sort_order` | `INT` | Yes |  |

### `academic_year`

Stores academic-year calendar and lifecycle records.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `academic_year_id` | `BIGINT` | Yes | Identity primary key |
| `code` | `VARCHAR(20)` | Yes | Unique |
| `name` | `VARCHAR(100)` | Yes |  |
| `start_date` | `DATE` | Yes |  |
| `end_date` | `DATE` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `is_published` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `year_status_id` | `BIGINT` | Yes |  |
| `last_updated` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by` | `VARCHAR(255)` | No |  |

### `academic_subject`

Stores academic subject records.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `subject_id` | `BIGINT` | Yes | Identity primary key |
| `department_id` | `BIGINT` | Yes | References `academic_department(department_id)` |
| `code` | `VARCHAR(20)` | Yes | Unique |
| `name` | `VARCHAR(255)` | Yes |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |

### `course`

Stores catalog course identities.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `course_id` | `BIGINT` | Yes | Identity primary key |
| `subject_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_subject(subject_id)` |
| `course_number` | `VARCHAR(20)` | Yes | Part of unique constraint |
| `is_lab` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `course_version`

Stores versioned course catalog details.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `course_version_id` | `BIGINT` | Yes | Identity primary key |
| `course_id` | `BIGINT` | Yes | Part of unique constraint; References `course(course_id)` |
| `version_number` | `INT` | Yes | Part of unique constraint |
| `title` | `VARCHAR(255)` | Yes |  |
| `catalog_description` | `TEXT` | No |  |
| `min_credits` | `DECIMAL(4,2)` | Yes |  |
| `max_credits` | `DECIMAL(4,2)` | Yes |  |
| `is_variable_credit` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `is_current` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `academic_sub_term`

Stores sub-terms within academic years.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `sub_term_id` | `BIGINT` | Yes | Identity primary key; Part of unique constraint |
| `academic_year_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_year(academic_year_id)` |
| `code` | `VARCHAR(20)` | Yes | Part of unique constraint |
| `name` | `VARCHAR(100)` | Yes |  |
| `start_date` | `DATE` | Yes |  |
| `end_date` | `DATE` | Yes |  |
| `sort_order` | `INT` | Yes | Part of unique constraint |
| `sub_term_status_id` | `BIGINT` | Yes | References `academic_sub_term_status(sub_term_status_id)` |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `last_updated` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `updated_by` | `VARCHAR(255)` | No |  |

### `academic_term`

Stores terms within academic years.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `term_id` | `BIGINT` | Yes | Identity primary key |
| `academic_year_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_year(academic_year_id)` |
| `code` | `VARCHAR(20)` | Yes | Part of unique constraint |
| `name` | `VARCHAR(100)` | Yes |  |
| `start_date` | `DATE` | Yes |  |
| `end_date` | `DATE` | Yes |  |

### `academic_term_sub_term`

Maps sub-terms to academic terms.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `term_id` | `BIGINT` | Yes | Primary key; References `academic_term(term_id)` |
| `sub_term_id` | `BIGINT` | Yes | Primary key; Unique; References `academic_sub_term(sub_term_id)` |

### `course_offering`

Stores course offerings for an academic year.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `course_offering_id` | `BIGINT` | Yes | Identity primary key; Part of unique constraint |
| `course_version_id` | `BIGINT` | Yes | Part of unique constraint; References `course_version(course_version_id)` |
| `academic_year_id` | `BIGINT` | Yes | Part of unique constraint; References `academic_year(academic_year_id)` |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `course_offering_sub_term`

Maps course offerings to sub-terms.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `course_offering_id` | `BIGINT` | Yes | Primary key; References `course_offering(course_offering_id, academic_year_id)` |
| `sub_term_id` | `BIGINT` | Yes | Primary key; References `academic_sub_term(sub_term_id, academic_year_id)` |
| `academic_year_id` | `BIGINT` | Yes | References `academic_sub_term(sub_term_id, academic_year_id)` |

## SQL

```sql
CREATE TABLE academic_school (
    school_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE academic_department (
    department_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    school_id BIGINT NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_academic_department_school
        FOREIGN KEY (school_id) REFERENCES academic_school(school_id),

    CONSTRAINT uq_academic_department_school_code
        UNIQUE (school_id, code)
);

CREATE TABLE academic_department_staff_role (
    academic_department_staff_role_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    department_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id BIGINT NULL,

    CONSTRAINT fk_academic_department_staff_role_department
        FOREIGN KEY (department_id)
            REFERENCES academic_department(department_id) ON DELETE CASCADE,

    CONSTRAINT fk_academic_department_staff_role_staff
        FOREIGN KEY (staff_id)
            REFERENCES staff(id) ON DELETE CASCADE,

    CONSTRAINT fk_academic_department_staff_role_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT uq_academic_department_staff_role
        UNIQUE (department_id, staff_id, role_code),

    CONSTRAINT chk_academic_department_staff_role_code
        CHECK (role_code IN ('DEPARTMENT_HEAD')),

    CONSTRAINT chk_academic_department_staff_role_dates
        CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_academic_department_staff_role_department
    ON academic_department_staff_role (department_id);

CREATE INDEX idx_academic_department_staff_role_staff
    ON academic_department_staff_role (staff_id);

CREATE INDEX idx_academic_department_staff_role_code
    ON academic_department_staff_role (role_code);

CREATE INDEX idx_academic_department_staff_role_updated_by
    ON academic_department_staff_role (updated_by_user_id);

CREATE TABLE academic_year_status (
    year_status_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    allow_linear_shift BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE academic_sub_term_status (
    sub_term_status_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    allow_linear_shift BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE academic_division (
    academic_division_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL
);

INSERT INTO academic_year_status (code, name, sort_order, allow_linear_shift) VALUES
    ('DRAFT', 'Draft', 1, TRUE),
    ('PLANNED', 'Planned', 2, TRUE),
    ('OPEN', 'Open', 3, TRUE),
    ('ACTIVE', 'Active', 4, TRUE),
    ('CLOSED', 'Closed', 5, TRUE),
    ('CANCELLED', 'Cancelled', 6, FALSE);

INSERT INTO academic_sub_term_status (code, name, sort_order, allow_linear_shift) VALUES
    ('DRAFT', 'Draft', 1, TRUE),
    ('PLANNED', 'Planned', 2, TRUE),
    ('OPEN_FOR_DISPLAY', 'Open for display', 3, TRUE),
    ('OPEN_FOR_REGISTRATION', 'Open for registration', 4, TRUE),
    ('REGISTRATION_CLOSED', 'Registration closed', 5, TRUE),
    ('ACTIVE', 'Active', 6, TRUE),
    ('COMPLETED', 'Completed', 7, TRUE),
    ('CANCELLED', 'Cancelled', 8, FALSE);

INSERT INTO academic_division (code, name, sort_order) VALUES
    ('UNDERGRADUATE', 'Undergraduate', 1),
    ('GRADUATE', 'Graduate', 2);

CREATE TABLE academic_year (
    academic_year_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    active BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,

    year_status_id BIGINT NOT NULL,

    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) DEFAULT NULL,


    CONSTRAINT chk_academic_year_date_range
       CHECK (start_date <= end_date)
);

CREATE TABLE academic_subject (
    subject_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    department_id BIGINT NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_academic_subject_department
        FOREIGN KEY (department_id) REFERENCES academic_department(department_id)
);

CREATE TABLE course (
    course_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    course_number VARCHAR(20) NOT NULL,
    is_lab BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_subject
        FOREIGN KEY (subject_id) REFERENCES academic_subject (subject_id),

    CONSTRAINT uq_course_subject_number
        UNIQUE (subject_id, course_number)
);

CREATE TABLE course_version (
    course_version_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    course_id BIGINT NOT NULL,

    version_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    catalog_description TEXT NULL,

    min_credits DECIMAL(4,2) NOT NULL,
    max_credits DECIMAL(4,2) NOT NULL,
    is_variable_credit BOOLEAN NOT NULL DEFAULT FALSE,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_version_course
        FOREIGN KEY (course_id) REFERENCES course(course_id),

    CONSTRAINT uq_course_version_course_version
        UNIQUE (course_id, version_number),

    CONSTRAINT chk_course_version_variable_credit
        CHECK (
            (is_variable_credit = TRUE AND min_credits <= max_credits)
            OR
            (is_variable_credit = FALSE AND min_credits = max_credits)
        )
);

CREATE TABLE academic_sub_term (
   sub_term_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

   academic_year_id BIGINT NOT NULL,

   code VARCHAR(20) NOT NULL,
   name VARCHAR(100) NOT NULL,

   start_date DATE NOT NULL,
   end_date DATE NOT NULL,

   sort_order INT NOT NULL,

   sub_term_status_id BIGINT NOT NULL,
   active BOOLEAN NOT NULL DEFAULT TRUE,

   last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_by VARCHAR(255) DEFAULT NULL,

   CONSTRAINT fk_academic_sub_term_academic_year
       FOREIGN KEY (academic_year_id) REFERENCES academic_year(academic_year_id),

   CONSTRAINT fk_academic_sub_term_status
       FOREIGN KEY (sub_term_status_id) REFERENCES academic_sub_term_status(sub_term_status_id),

   CONSTRAINT uq_academic_sub_term_year_code
       UNIQUE (academic_year_id, code),

   CONSTRAINT uq_academic_sub_term_year_sort_order
       UNIQUE (academic_year_id, sort_order),

   CONSTRAINT uq_academic_sub_term_id_year
       UNIQUE (sub_term_id, academic_year_id),

   CONSTRAINT chk_academic_sub_term_date_range
       CHECK (start_date <= end_date)
);

CREATE TABLE academic_term (
    term_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

    academic_year_id BIGINT NOT NULL,

    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    CONSTRAINT fk_academic_term_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_year(academic_year_id),

    CONSTRAINT uq_academic_term_year_code
        UNIQUE (academic_year_id, code),

    CONSTRAINT chk_academic_term_date_range
        CHECK (start_date <= end_date)
);

CREATE TABLE academic_term_sub_term (
    term_id BIGINT NOT NULL,
    sub_term_id BIGINT NOT NULL,

    PRIMARY KEY (term_id, sub_term_id),

    CONSTRAINT uq_academic_term_sub_term_sub_term
        UNIQUE (sub_term_id),

    CONSTRAINT fk_academic_term_sub_term_term
        FOREIGN KEY (term_id) REFERENCES academic_term(term_id),

    CONSTRAINT fk_academic_term_sub_term_sub_term
        FOREIGN KEY (sub_term_id) REFERENCES academic_sub_term(sub_term_id)
);

CREATE TABLE course_offering (
    course_offering_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

    course_version_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,

    notes VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_offering_course_version
        FOREIGN KEY (course_version_id)
            REFERENCES course_version(course_version_id),

    CONSTRAINT fk_course_offering_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_year(academic_year_id),

    CONSTRAINT uq_course_offering_version_year
        UNIQUE (course_version_id, academic_year_id),

    CONSTRAINT uq_course_offering_id_year
        UNIQUE (course_offering_id, academic_year_id)
);

CREATE TABLE course_offering_sub_term (
    course_offering_id BIGINT NOT NULL,
    sub_term_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,

    PRIMARY KEY (course_offering_id, sub_term_id),

    CONSTRAINT fk_course_offering_sub_term_offering
        FOREIGN KEY (course_offering_id, academic_year_id)
            REFERENCES course_offering(course_offering_id, academic_year_id),

    CONSTRAINT fk_course_offering_sub_term_sub_term
        FOREIGN KEY (sub_term_id, academic_year_id)
            REFERENCES academic_sub_term(sub_term_id, academic_year_id)
);

CREATE UNIQUE INDEX uq_course_version_current_course
    ON course_version (course_id)
    WHERE is_current = TRUE;

CREATE TRIGGER trg_academic_year_last_updated
BEFORE UPDATE ON academic_year
FOR EACH ROW
EXECUTE FUNCTION set_last_updated_timestamp();

CREATE TRIGGER trg_course_updated_at
BEFORE UPDATE ON course
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_course_version_updated_at
BEFORE UPDATE ON course_version
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_academic_sub_term_last_updated
BEFORE UPDATE ON academic_sub_term
FOR EACH ROW
EXECUTE FUNCTION set_last_updated_timestamp();

CREATE TRIGGER trg_course_offering_updated_at
BEFORE UPDATE ON course_offering
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
```

## Notes

- Keep this document aligned with `api/src/main/resources/db/migration/V5__create_catalog_tables.sql`; the SQL block is included so reviewers can compare the table summary against the migration.
- Reference and seed data inserted by the migration are part of the migration contract, but the tables above describe the stored shape.
