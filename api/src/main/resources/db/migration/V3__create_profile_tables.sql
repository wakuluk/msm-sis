CREATE TABLE student (
 student_id BIGINT NOT NULL AUTO_INCREMENT,
 user_id BIGINT NULL,

 last_name VARCHAR(50) NOT NULL,
 first_name VARCHAR(50) NOT NULL,
 middle_name VARCHAR(50) DEFAULT NULL,
 name_suffix VARCHAR(10) DEFAULT NULL,

 gender_id INT DEFAULT NULL,
 ethnicity_id INT DEFAULT NULL,
 class_standing_id INT DEFAULT NULL,
 address_id BIGINT DEFAULT NULL,
 preferred_name VARCHAR(255) DEFAULT NULL,

-- SSN (secure design)
 ssn_encrypted VARBINARY(255),
 ssn_lookup_hash CHAR(64) DEFAULT NULL,

 date_of_birth DATE DEFAULT NULL,
 estimated_grad_date DATE DEFAULT NULL,

 alt_id VARCHAR(50) DEFAULT NULL,
 email VARCHAR(255) DEFAULT NULL,
 phone VARCHAR(30) DEFAULT NULL,

 is_disabled BOOLEAN NOT NULL DEFAULT FALSE,

 last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 updated_by VARCHAR(255) DEFAULT NULL,

 PRIMARY KEY (student_id),
 CONSTRAINT uk_student_user_id UNIQUE (user_id),
 CONSTRAINT fk_students_user
     FOREIGN KEY (user_id) REFERENCES users(id)
         ON DELETE SET NULL,
 CONSTRAINT fk_student_ethnicity
     FOREIGN KEY (ethnicity_id) REFERENCES ethnicity(ethnicity_id)
         ON DELETE SET NULL,
 CONSTRAINT fk_student_gender
     FOREIGN KEY (gender_id) REFERENCES gender(gender_id)
         ON DELETE SET NULL,
 CONSTRAINT fk_student_class_standing
     FOREIGN KEY (class_standing_id) REFERENCES class_standing(class_standing_id)
         ON DELETE SET NULL,
 CONSTRAINT fk_student_address
     FOREIGN KEY (address_id) REFERENCES address(address_id)
         ON DELETE SET NULL,
 KEY idx_student_ethnicity (ethnicity_id),
 KEY idx_student_gender (gender_id),
 KEY idx_student_class_standing (class_standing_id),
 KEY idx_student_address (address_id),
 KEY idx_student_name (last_name, first_name, middle_name),
 KEY idx_students_active_name (is_disabled, last_name),

-- future-proof: allows easy uniqueness later
 UNIQUE KEY uk_student_ssn_lookup_hash (ssn_lookup_hash)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE staff (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_staff_user_id UNIQUE (user_id),
    CONSTRAINT fk_staff_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
);
