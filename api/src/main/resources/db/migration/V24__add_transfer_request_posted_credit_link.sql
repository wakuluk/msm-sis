ALTER TABLE transfer_request_course
    ADD COLUMN posted_student_transfer_credit_id BIGINT;

ALTER TABLE transfer_request_course
    ADD CONSTRAINT fk_transfer_request_course_posted_credit
        FOREIGN KEY (posted_student_transfer_credit_id)
            REFERENCES student_transfer_credit(student_transfer_credit_id);

ALTER TABLE transfer_request_course
    ADD CONSTRAINT uq_transfer_request_course_posted_credit
        UNIQUE (posted_student_transfer_credit_id);
