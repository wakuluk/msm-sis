CREATE TABLE academic_department (
    department_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE academic_year_status (
    year_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    allow_linear_shift BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE academic_term_status (
    term_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    allow_linear_shift BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE course_offering_status (
    course_offering_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    allow_linear_shift BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO academic_year_status (code, name, sort_order, allow_linear_shift) VALUES
    ('DRAFT', 'Draft', 1, TRUE),
    ('PLANNED', 'Planned', 2, TRUE),
    ('OPEN', 'Open', 3, TRUE),
    ('ACTIVE', 'Active', 4, TRUE),
    ('CLOSED', 'Closed', 5, TRUE),
    ('CANCELLED', 'Cancelled', 6, FALSE);

INSERT INTO academic_term_status (code, name, sort_order, allow_linear_shift) VALUES
    ('DRAFT', 'Draft', 1, TRUE),
    ('PLANNED', 'Planned', 2, TRUE),
    ('OPEN_FOR_DISPLAY', 'Open for display', 3, TRUE),
    ('OPEN_FOR_REGISTRATION', 'Open for registration', 4, TRUE),
    ('REGISTRATION_CLOSED', 'Registration closed', 5, TRUE),
    ('ACTIVE', 'Active', 6, TRUE),
    ('COMPLETED', 'Completed', 7, TRUE),
    ('CANCELLED', 'Cancelled', 8, FALSE);

INSERT INTO course_offering_status (code, name, sort_order, allow_linear_shift) VALUES
    ('DRAFT', 'Draft', 1, TRUE),
    ('PLANNED', 'Planned', 2, TRUE),
    ('OPEN_FOR_DISPLAY', 'Open for Display', 3, TRUE),
    ('OPEN_FOR_REGISTRATION', 'Open for Registration', 4, TRUE),
    ('CLOSED', 'Closed', 5, TRUE),
    ('CANCELLED', 'Cancelled', 6, FALSE);

CREATE TABLE academic_year (
    academic_year_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    active BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,

    year_status_id BIGINT NOT NULL,

    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) DEFAULT NULL,


    CONSTRAINT chk_academic_year_date_range
       CHECK (start_date <= end_date)
);

CREATE TABLE academic_subject (
    subject_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department_id BIGINT NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_academic_subject_department
        FOREIGN KEY (department_id) REFERENCES academic_department(department_id)
);

CREATE TABLE course (
    course_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL,
    course_number VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_subject
        FOREIGN KEY (subject_id) REFERENCES academic_subject (subject_id),

    CONSTRAINT uq_course_subject_number
        UNIQUE (subject_id, course_number)
);

CREATE TABLE course_version (
    course_version_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,

    version_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    catalog_description TEXT NULL,

    min_credits DECIMAL(4,2) NOT NULL,
    max_credits DECIMAL(4,2) NOT NULL,
    is_variable_credit BOOLEAN NOT NULL DEFAULT FALSE,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_version_course
        FOREIGN KEY (course_id) REFERENCES course(course_id),

    CONSTRAINT uq_course_version_course_version
        UNIQUE (course_id, version_number),

    CONSTRAINT chk_course_version_variable_credit
        CHECK (
            (is_variable_credit = TRUE AND min_credits <= max_credits)
            OR
            (is_variable_credit = FALSE AND min_credits = max_credits)
        ),

    CONSTRAINT chk_course_version_default_active
        CHECK (is_default = FALSE OR active = TRUE)
);

CREATE TABLE academic_term (
   term_id BIGINT PRIMARY KEY AUTO_INCREMENT,

   academic_year_id BIGINT NOT NULL,

   code VARCHAR(20) NOT NULL,
   name VARCHAR(100) NOT NULL,

   start_date DATE NOT NULL,
   end_date DATE NOT NULL,

   sort_order INT NOT NULL,

   term_status_id BIGINT NOT NULL,
   active BOOLEAN NOT NULL DEFAULT TRUE,

   last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   updated_by VARCHAR(255) DEFAULT NULL,

   CONSTRAINT fk_academic_term_academic_year
       FOREIGN KEY (academic_year_id) REFERENCES academic_year(academic_year_id),

   CONSTRAINT fk_academic_term_status
       FOREIGN KEY (term_status_id) REFERENCES academic_term_status(term_status_id),

   CONSTRAINT uq_academic_term_year_code
       UNIQUE (academic_year_id, code),

   CONSTRAINT uq_academic_term_year_sort_order
       UNIQUE (academic_year_id, sort_order),

   CONSTRAINT chk_academic_term_date_range
       CHECK (start_date <= end_date)
);

CREATE TABLE course_offering (
    course_offering_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    course_version_id BIGINT NOT NULL,
    term_id BIGINT NOT NULL,

    course_offering_status_id BIGINT NOT NULL,
    notes VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_offering_status
        FOREIGN KEY (course_offering_status_id)
            REFERENCES course_offering_status(course_offering_status_id),

    CONSTRAINT fk_course_offering_course_version
        FOREIGN KEY (course_version_id)
            REFERENCES course_version(course_version_id),

    CONSTRAINT fk_course_offering_term
        FOREIGN KEY (term_id) REFERENCES academic_term(term_id),

    CONSTRAINT uq_course_offering_version_term
        UNIQUE (course_version_id, term_id)
);
