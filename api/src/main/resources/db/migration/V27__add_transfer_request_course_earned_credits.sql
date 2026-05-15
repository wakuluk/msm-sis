ALTER TABLE transfer_request_course
    ADD COLUMN earned_credits DECIMAL(5,2);

ALTER TABLE transfer_request_course
    ADD CONSTRAINT chk_transfer_request_course_earned_credits
        CHECK (earned_credits IS NULL OR earned_credits >= 0);
