ALTER TABLE transfer_institution
    ADD COLUMN institution_level VARCHAR(20);

ALTER TABLE transfer_institution
    ADD CONSTRAINT chk_transfer_institution_level
        CHECK (institution_level IS NULL OR institution_level IN ('TWO_YEAR', 'FOUR_YEAR'));

ALTER TABLE transfer_request
    ADD COLUMN transfer_institution_id BIGINT,
    ADD COLUMN institution_matched_by_user_id BIGINT,
    ADD COLUMN institution_matched_at TIMESTAMP,
    ADD COLUMN one_off_institution_name VARCHAR(255),
    ADD COLUMN one_off_institution_address_line_1 VARCHAR(255),
    ADD COLUMN one_off_institution_address_line_2 VARCHAR(255),
    ADD COLUMN one_off_institution_city VARCHAR(120),
    ADD COLUMN one_off_institution_state_region VARCHAR(120),
    ADD COLUMN one_off_institution_postal_code VARCHAR(40),
    ADD COLUMN one_off_institution_country_code VARCHAR(2),
    ADD COLUMN one_off_institution_website VARCHAR(255),
    ADD COLUMN institution_level VARCHAR(20);

ALTER TABLE transfer_request
    ADD CONSTRAINT fk_transfer_request_institution
        FOREIGN KEY (transfer_institution_id)
            REFERENCES transfer_institution(transfer_institution_id);

ALTER TABLE transfer_request
    ADD CONSTRAINT fk_transfer_request_institution_matched_by
        FOREIGN KEY (institution_matched_by_user_id)
            REFERENCES users(id);

ALTER TABLE transfer_request
    ADD CONSTRAINT chk_transfer_request_institution_level
        CHECK (institution_level IS NULL OR institution_level IN ('TWO_YEAR', 'FOUR_YEAR'));

ALTER TABLE transfer_request
    ADD CONSTRAINT chk_transfer_request_institution_match_pair
        CHECK (
            (
                transfer_institution_id IS NULL
                AND institution_matched_by_user_id IS NULL
                AND institution_matched_at IS NULL
            )
            OR (
                transfer_institution_id IS NOT NULL
                AND institution_matched_by_user_id IS NOT NULL
                AND institution_matched_at IS NOT NULL
            )
        );

CREATE INDEX idx_transfer_request_institution
    ON transfer_request (transfer_institution_id);

CREATE INDEX idx_transfer_request_institution_matched_by
    ON transfer_request (institution_matched_by_user_id);
