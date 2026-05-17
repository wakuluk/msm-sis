# Transfer Credit Tables

This documents the database shape for 5 tables: `transfer_institution`, `transfer_course_equivalency`, `transfer_course_equivalency_course`, `student_transfer_credit`, `student_transfer_credit_course`. It supports:

- Stores transfer-credit source institutions
- Stores external-to-institutional course equivalency headers
- Maps equivalencies to internal course versions
- Stores posted student transfer-credit awards
- Maps transfer-credit awards to internal course versions

Implemented by Flyway migration:
`api/src/main/resources/db/migration/V9__create_transfer_credit_tables.sql`.

## Tables

### `transfer_institution`

Stores transfer-credit source institutions.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `transfer_institution_id` | `BIGINT` | Yes | Identity primary key |
| `code` | `VARCHAR(50)` | Yes | Unique |
| `name` | `VARCHAR(255)` | Yes |  |
| `address_line_1` | `VARCHAR(255)` | No |  |
| `address_line_2` | `VARCHAR(255)` | No |  |
| `city` | `VARCHAR(120)` | No |  |
| `state_region` | `VARCHAR(120)` | No |  |
| `postal_code` | `VARCHAR(40)` | No |  |
| `country_code` | `VARCHAR(2)` | No |  |
| `website` | `VARCHAR(255)` | No |  |
| `institution_level` | `VARCHAR(20)` | No |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `transfer_course_equivalency`

Stores external-to-institutional course equivalency headers.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `transfer_course_equivalency_id` | `BIGINT` | Yes | Identity primary key; Part of unique constraint |
| `transfer_institution_id` | `BIGINT` | Yes | Part of unique constraint; References `transfer_institution(transfer_institution_id)` |
| `external_subject_code` | `VARCHAR(20)` | Yes |  |
| `external_course_number` | `VARCHAR(20)` | Yes |  |
| `external_course_title` | `VARCHAR(255)` | No |  |
| `external_course_description` | `TEXT` | No |  |
| `external_credits` | `DECIMAL(5,2)` | No |  |
| `active` | `BOOLEAN` | Yes | Defaults to `TRUE` |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |
| `created_by_user_id` | `BIGINT` | No | References `users(id)` |
| `updated_by_user_id` | `BIGINT` | No | References `users(id)` |

### `transfer_course_equivalency_course`

Maps equivalencies to internal course versions.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `transfer_course_equivalency_course_id` | `BIGINT` | Yes | Identity primary key |
| `transfer_course_equivalency_id` | `BIGINT` | Yes | Part of unique constraint; References `transfer_course_equivalency(transfer_course_equivalency_id)` |
| `course_id` | `BIGINT` | Yes | Part of unique constraint; References `course(course_id)` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `student_transfer_credit`

Stores posted student transfer-credit awards.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_transfer_credit_id` | `BIGINT` | Yes | Identity primary key |
| `student_id` | `BIGINT` | Yes | Part of unique constraint; References `student(student_id)` |
| `transfer_institution_id` | `BIGINT` | No | References `transfer_course_equivalency(transfer_course_equivalency_id, transfer_institution_id)` |
| `transfer_course_equivalency_id` | `BIGINT` | No | References `transfer_course_equivalency(transfer_course_equivalency_id, transfer_institution_id)` |
| `transfer_institution_name_snapshot` | `VARCHAR(255)` | Yes | Part of unique constraint |
| `transfer_institution_address_line_1_snapshot` | `VARCHAR(255)` | No |  |
| `transfer_institution_address_line_2_snapshot` | `VARCHAR(255)` | No |  |
| `transfer_institution_city_snapshot` | `VARCHAR(120)` | No |  |
| `transfer_institution_state_region_snapshot` | `VARCHAR(120)` | No |  |
| `transfer_institution_postal_code_snapshot` | `VARCHAR(40)` | No |  |
| `transfer_institution_country_code_snapshot` | `VARCHAR(2)` | No |  |
| `transfer_institution_website_snapshot` | `VARCHAR(255)` | No |  |
| `transfer_institution_level_snapshot` | `VARCHAR(20)` | No |  |
| `external_term_label` | `VARCHAR(100)` | Yes | Part of unique constraint |
| `transcript_sort_date` | `DATE` | Yes |  |
| `external_subject_code` | `VARCHAR(20)` | Yes | Part of unique constraint |
| `external_course_number` | `VARCHAR(20)` | Yes | Part of unique constraint |
| `external_course_title` | `VARCHAR(255)` | Yes |  |
| `transfer_grade_mark` | `VARCHAR(20)` | Yes | Defaults to `'P'` |
| `credits_attempted` | `DECIMAL(5,2)` | Yes |  |
| `credits_earned` | `DECIMAL(5,2)` | Yes |  |
| `gpa_credits` | `DECIMAL(5,2)` | Yes | Defaults to `0` |
| `quality_points` | `DECIMAL(7,2)` | Yes | Defaults to `0` |
| `include_in_gpa` | `BOOLEAN` | Yes | Defaults to `FALSE` |
| `posted_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP` |
| `notes` | `VARCHAR(500)` | No |  |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

### `student_transfer_credit_course`

Maps transfer-credit awards to internal course versions.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `student_transfer_credit_course_id` | `BIGINT` | Yes | Identity primary key |
| `student_transfer_credit_id` | `BIGINT` | Yes | Part of unique constraint; References `student_transfer_credit(student_transfer_credit_id)` |
| `course_id` | `BIGINT` | Yes | Part of unique constraint; References `course(course_id)` |
| `created_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | Defaults to `CURRENT_TIMESTAMP`; Maintained by trigger where defined |

## SQL

```sql
CREATE TABLE transfer_institution (
    transfer_institution_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(120),
    state_region VARCHAR(120),
    postal_code VARCHAR(40),
    country_code VARCHAR(2),
    website VARCHAR(255),
    institution_level VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_transfer_institution_code UNIQUE (code),

    CONSTRAINT chk_transfer_institution_level
        CHECK (institution_level IS NULL OR institution_level IN ('TWO_YEAR', 'FOUR_YEAR'))
);

CREATE TABLE transfer_course_equivalency (
    transfer_course_equivalency_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    transfer_institution_id BIGINT NOT NULL,

    external_subject_code VARCHAR(20) NOT NULL,
    external_course_number VARCHAR(20) NOT NULL,
    external_course_title VARCHAR(255) NULL,
    external_course_description TEXT,
    external_credits DECIMAL(5,2),

    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id BIGINT,
    updated_by_user_id BIGINT,

    CONSTRAINT fk_transfer_course_equivalency_institution
        FOREIGN KEY (transfer_institution_id)
            REFERENCES transfer_institution(transfer_institution_id),

    CONSTRAINT fk_transfer_course_equivalency_created_by
        FOREIGN KEY (created_by_user_id)
            REFERENCES users(id),

    CONSTRAINT fk_transfer_course_equivalency_updated_by
        FOREIGN KEY (updated_by_user_id)
            REFERENCES users(id),

    CONSTRAINT uq_transfer_course_equivalency_institution
        UNIQUE (transfer_course_equivalency_id, transfer_institution_id),

    CONSTRAINT chk_transfer_course_equivalency_external_credits
        CHECK (external_credits IS NULL OR external_credits >= 0)
);

CREATE UNIQUE INDEX uq_transfer_course_equivalency_active
    ON transfer_course_equivalency (transfer_institution_id, external_subject_code, external_course_number)
    WHERE active = TRUE;

CREATE TABLE transfer_course_equivalency_course (
    transfer_course_equivalency_course_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    transfer_course_equivalency_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transfer_course_equivalency_course_equivalency
        FOREIGN KEY (transfer_course_equivalency_id)
            REFERENCES transfer_course_equivalency(transfer_course_equivalency_id) ON DELETE CASCADE,

    CONSTRAINT fk_transfer_course_equivalency_course_course
        FOREIGN KEY (course_id)
            REFERENCES course(course_id),

    CONSTRAINT uq_transfer_course_equivalency_course
        UNIQUE (transfer_course_equivalency_id, course_id)
);

CREATE TABLE student_transfer_credit (
    student_transfer_credit_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL,
    transfer_institution_id BIGINT NULL,
    transfer_course_equivalency_id BIGINT NULL,
    transfer_institution_name_snapshot VARCHAR(255) NOT NULL,
    transfer_institution_address_line_1_snapshot VARCHAR(255),
    transfer_institution_address_line_2_snapshot VARCHAR(255),
    transfer_institution_city_snapshot VARCHAR(120),
    transfer_institution_state_region_snapshot VARCHAR(120),
    transfer_institution_postal_code_snapshot VARCHAR(40),
    transfer_institution_country_code_snapshot VARCHAR(2),
    transfer_institution_website_snapshot VARCHAR(255),
    transfer_institution_level_snapshot VARCHAR(20),

    external_term_label VARCHAR(100) NOT NULL,
    transcript_sort_date DATE NOT NULL,

    external_subject_code VARCHAR(20) NOT NULL,
    external_course_number VARCHAR(20) NOT NULL,
    external_course_title VARCHAR(255) NOT NULL,

    transfer_grade_mark VARCHAR(20) NOT NULL DEFAULT 'P',
    credits_attempted DECIMAL(5,2) NOT NULL,
    credits_earned DECIMAL(5,2) NOT NULL,
    gpa_credits DECIMAL(5,2) NOT NULL DEFAULT 0,
    quality_points DECIMAL(7,2) NOT NULL DEFAULT 0,
    include_in_gpa BOOLEAN NOT NULL DEFAULT FALSE,

    posted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_transfer_credit_student
        FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_transfer_credit_institution
        FOREIGN KEY (transfer_institution_id)
            REFERENCES transfer_institution(transfer_institution_id),

    CONSTRAINT fk_student_transfer_credit_equivalency
        FOREIGN KEY (transfer_course_equivalency_id, transfer_institution_id)
            REFERENCES transfer_course_equivalency(transfer_course_equivalency_id, transfer_institution_id),

    CONSTRAINT uq_student_transfer_credit_course
        UNIQUE (
            student_id,
            transfer_institution_name_snapshot,
            external_term_label,
            external_subject_code,
            external_course_number
        ),

    CONSTRAINT chk_student_transfer_credit_institution_level_snapshot
        CHECK (
            transfer_institution_level_snapshot IS NULL
            OR transfer_institution_level_snapshot IN ('TWO_YEAR', 'FOUR_YEAR')
        ),

    CONSTRAINT chk_student_transfer_credit_attempted
        CHECK (credits_attempted >= 0),

    CONSTRAINT chk_student_transfer_credit_earned
        CHECK (credits_earned >= 0),

    CONSTRAINT chk_student_transfer_credit_gpa_credits
        CHECK (gpa_credits >= 0),

    CONSTRAINT chk_student_transfer_credit_quality_points
        CHECK (quality_points >= 0),

    CONSTRAINT chk_student_transfer_credit_earned_consistency
        CHECK (credits_earned <= credits_attempted),

    CONSTRAINT chk_student_transfer_credit_grade_mark
        CHECK (transfer_grade_mark IN ('P', 'F'))
);

CREATE TABLE student_transfer_credit_course (
    student_transfer_credit_course_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_transfer_credit_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_transfer_credit_course_credit
        FOREIGN KEY (student_transfer_credit_id)
            REFERENCES student_transfer_credit(student_transfer_credit_id) ON DELETE CASCADE,

    CONSTRAINT fk_student_transfer_credit_course_course
        FOREIGN KEY (course_id)
            REFERENCES course(course_id),

    CONSTRAINT uq_student_transfer_credit_course_equivalency
        UNIQUE (student_transfer_credit_id, course_id)
);

CREATE INDEX idx_student_transfer_credit_student
    ON student_transfer_credit (student_id);

CREATE INDEX idx_student_transfer_credit_institution
    ON student_transfer_credit (transfer_institution_id);

CREATE INDEX idx_student_transfer_credit_equivalency
    ON student_transfer_credit (transfer_course_equivalency_id);

CREATE INDEX idx_student_transfer_credit_sort
    ON student_transfer_credit (student_id, transcript_sort_date);

CREATE INDEX idx_transfer_course_equivalency_institution
    ON transfer_course_equivalency (transfer_institution_id);

CREATE INDEX idx_transfer_course_equivalency_created_by
    ON transfer_course_equivalency (created_by_user_id);

CREATE INDEX idx_transfer_course_equivalency_updated_by
    ON transfer_course_equivalency (updated_by_user_id);

CREATE INDEX idx_transfer_course_equivalency_course_equivalency
    ON transfer_course_equivalency_course (transfer_course_equivalency_id);

CREATE INDEX idx_transfer_course_equivalency_course_course
    ON transfer_course_equivalency_course (course_id);

CREATE INDEX idx_student_transfer_credit_course_credit
    ON student_transfer_credit_course (student_transfer_credit_id);

CREATE INDEX idx_student_transfer_credit_course_course
    ON student_transfer_credit_course (course_id);

CREATE TRIGGER trg_transfer_institution_updated_at
    BEFORE UPDATE ON transfer_institution
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_transfer_course_equivalency_updated_at
    BEFORE UPDATE ON transfer_course_equivalency
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_transfer_course_equivalency_course_updated_at
    BEFORE UPDATE ON transfer_course_equivalency_course
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_transfer_credit_updated_at
    BEFORE UPDATE ON student_transfer_credit
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_student_transfer_credit_course_updated_at
    BEFORE UPDATE ON student_transfer_credit_course
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
```

## Notes

- Keep this document aligned with `api/src/main/resources/db/migration/V9__create_transfer_credit_tables.sql`; the SQL block is included so reviewers can compare the table summary against the migration.
- Reference and seed data inserted by the migration are part of the migration contract, but the tables above describe the stored shape.
