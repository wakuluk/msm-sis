WITH target_institutions(code, name) AS (
    VALUES
        ('WESTFARTHING', 'Westfarthing Community College'),
        ('BLUE_MOUNTAIN', 'Blue Mountain College')
),
upserted_institutions AS (
    INSERT INTO transfer_institution (code, name, active)
    SELECT code, name, TRUE
    FROM target_institutions
    ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            active = TRUE
    RETURNING transfer_institution_id, code
),
all_target_institutions AS (
    SELECT transfer_institution_id, code
    FROM upserted_institutions

    UNION

    SELECT transfer_institution_id, code
    FROM transfer_institution
    WHERE code IN (SELECT code FROM target_institutions)
),
target_students AS (
    SELECT student_id, alt_id
    FROM student
    WHERE alt_id IN ('STU-1001', 'SEC-2029')
),
desired_transfer_credits(
    institution_code,
    external_term_label,
    transcript_sort_date,
    external_subject_code,
    external_course_number,
    external_course_title,
    local_subject_code,
    local_course_number,
    local_course_title,
    transfer_grade_mark,
    credits_attempted,
    credits_earned,
    gpa_credits,
    quality_points,
    include_in_gpa,
    notes
) AS (
    VALUES
        (
            'WESTFARTHING',
            'Spring 2026 Transfer Credit',
            '2026-01-19'::date,
            'HIST',
            '110',
            'World History',
            'HIST',
            '110',
            'World History',
            'P',
            3.00,
            3.00,
            0.00,
            0.00,
            FALSE,
            'POC transcript seed credit'
        ),
        (
            'WESTFARTHING',
            'Fall 2026 Transfer Credit',
            '2026-08-24'::date,
            'WRT',
            '101',
            'College Writing',
            'WRT',
            '101',
            'College Writing',
            'P',
            3.00,
            3.00,
            0.00,
            0.00,
            FALSE,
            'POC transcript seed credit'
        ),
        (
            'WESTFARTHING',
            'Fall 2026 Transfer Credit',
            '2026-08-24'::date,
            'MATH',
            '120',
            'College Algebra',
            'MATH',
            '120',
            'College Algebra',
            'P',
            3.00,
            3.00,
            0.00,
            0.00,
            FALSE,
            'POC transcript seed credit'
        ),
        (
            'BLUE_MOUNTAIN',
            'Summer 2027 Transfer Credit',
            '2027-06-05'::date,
            'BIO',
            '150',
            'Principles of Biology',
            'BIO',
            '150',
            'Principles of Biology',
            'P',
            4.00,
            4.00,
            0.00,
            0.00,
            FALSE,
            'POC transcript seed credit'
        )
)
INSERT INTO student_transfer_credit (
    student_id,
    transfer_institution_id,
    external_term_label,
    transcript_sort_date,
    external_subject_code,
    external_course_number,
    external_course_title,
    local_subject_code,
    local_course_number,
    local_course_title,
    transfer_grade_mark,
    credits_attempted,
    credits_earned,
    gpa_credits,
    quality_points,
    include_in_gpa,
    notes
)
SELECT ts.student_id,
       ati.transfer_institution_id,
       desired_transfer_credits.external_term_label,
       desired_transfer_credits.transcript_sort_date,
       desired_transfer_credits.external_subject_code,
       desired_transfer_credits.external_course_number,
       desired_transfer_credits.external_course_title,
       desired_transfer_credits.local_subject_code,
       desired_transfer_credits.local_course_number,
       desired_transfer_credits.local_course_title,
       desired_transfer_credits.transfer_grade_mark,
       desired_transfer_credits.credits_attempted,
       desired_transfer_credits.credits_earned,
       desired_transfer_credits.gpa_credits,
       desired_transfer_credits.quality_points,
       desired_transfer_credits.include_in_gpa,
       desired_transfer_credits.notes
FROM desired_transfer_credits
JOIN target_students ts
  ON TRUE
JOIN all_target_institutions ati
  ON ati.code = desired_transfer_credits.institution_code
ON CONFLICT ON CONSTRAINT uq_student_transfer_credit_course DO UPDATE
    SET transcript_sort_date = EXCLUDED.transcript_sort_date,
        external_course_title = EXCLUDED.external_course_title,
        local_subject_code = EXCLUDED.local_subject_code,
        local_course_number = EXCLUDED.local_course_number,
        local_course_title = EXCLUDED.local_course_title,
        transfer_grade_mark = EXCLUDED.transfer_grade_mark,
        credits_attempted = EXCLUDED.credits_attempted,
        credits_earned = EXCLUDED.credits_earned,
        gpa_credits = EXCLUDED.gpa_credits,
        quality_points = EXCLUDED.quality_points,
        include_in_gpa = EXCLUDED.include_in_gpa,
        notes = EXCLUDED.notes;
