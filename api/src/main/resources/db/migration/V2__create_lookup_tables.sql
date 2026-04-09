CREATE TABLE ethnicity (
    ethnicity_id INT NOT NULL AUTO_INCREMENT,
    ethnicity_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (ethnicity_id),
    CONSTRAINT uk_ethnicity_name UNIQUE (ethnicity_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE class_standing (
    class_standing_id INT NOT NULL AUTO_INCREMENT,
    class_standing_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (class_standing_id),
    CONSTRAINT uk_class_standing_name UNIQUE (class_standing_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE gender (
    gender_id INT NOT NULL AUTO_INCREMENT,
    gender_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (gender_id),
    CONSTRAINT uk_gender_name UNIQUE (gender_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE address (
    address_id BIGINT NOT NULL AUTO_INCREMENT,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    state_region VARCHAR(100) DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    country_code CHAR(2) DEFAULT NULL,
    address_lookup_hash CHAR(64) DEFAULT NULL,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (address_id),
    KEY idx_address_city_state (city, state_region),
    KEY idx_address_postal_code (postal_code),
    KEY idx_address_lookup_hash (address_lookup_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
