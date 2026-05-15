ALTER TABLE transfer_institution
    ADD COLUMN address_line_1 VARCHAR(255),
    ADD COLUMN address_line_2 VARCHAR(255),
    ADD COLUMN city VARCHAR(120),
    ADD COLUMN state_region VARCHAR(120),
    ADD COLUMN postal_code VARCHAR(40),
    ADD COLUMN country_code VARCHAR(2),
    ADD COLUMN website VARCHAR(255);
