DELETE FROM student_transfer_credit
WHERE student_id IN (
    SELECT student_id
    FROM student
    WHERE alt_id = 'STU-1001'
);

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
desired_transfer_mappings(
    institution_code,
    external_subject_code,
    external_course_number,
    external_course_title,
    local_subject_code,
    local_course_number,
    local_course_title
) AS (
    VALUES
        ('WESTFARTHING', 'HIST', '110', 'World History', 'HIST', '110', 'World History'),
        ('WESTFARTHING', 'WRT', '101', 'College Writing', 'WRT', '101', 'College Writing'),
        ('WESTFARTHING', 'MATH', '120', 'College Algebra', 'MATH', '120', 'College Algebra'),
        ('WESTFARTHING', 'LIT', '101', 'Introduction to Legends', 'TOLK', '101', 'Introduction to Tolkien Studies'),
        ('WESTFARTHING', 'LIT', '240', 'Myth and Language', 'TOLK', '240', 'Tolkien, Myth, and Language'),
        ('BLUE_MOUNTAIN', 'BIO', '150', 'Principles of Biology', 'BIO', '150', 'Principles of Biology'),
        ('BLUE_MOUNTAIN', 'MEH', '310', 'Kingship and Stewardship', 'MEH', '310', 'Kingship and Stewardship in Middle-earth')
),
upserted_equivalencies AS (
    INSERT INTO transfer_course_equivalency (
        transfer_institution_id,
        external_subject_code,
        external_course_number,
        external_course_title,
        active,
        notes
    )
    SELECT ati.transfer_institution_id,
           desired_transfer_mappings.external_subject_code,
           desired_transfer_mappings.external_course_number,
           desired_transfer_mappings.external_course_title,
           TRUE,
           'POC reusable transfer map'
    FROM desired_transfer_mappings
    JOIN all_target_institutions ati
      ON ati.code = desired_transfer_mappings.institution_code
    ON CONFLICT ON CONSTRAINT uq_transfer_course_equivalency DO UPDATE
        SET external_course_title = EXCLUDED.external_course_title,
            active = TRUE,
            notes = EXCLUDED.notes
    RETURNING transfer_course_equivalency_id,
              transfer_institution_id,
              external_subject_code,
              external_course_number
),
all_target_equivalencies AS (
    SELECT transfer_course_equivalency_id,
           transfer_institution_id,
           external_subject_code,
           external_course_number
    FROM upserted_equivalencies

    UNION

    SELECT transfer_course_equivalency_id,
           transfer_institution_id,
           external_subject_code,
           external_course_number
    FROM transfer_course_equivalency
    WHERE (transfer_institution_id, external_subject_code, external_course_number) IN (
        SELECT ati.transfer_institution_id,
               desired_transfer_mappings.external_subject_code,
               desired_transfer_mappings.external_course_number
        FROM desired_transfer_mappings
        JOIN all_target_institutions ati
          ON ati.code = desired_transfer_mappings.institution_code
    )
),
seeded_equivalency_courses AS (
    INSERT INTO transfer_course_equivalency_course (
        transfer_course_equivalency_id,
        course_id
    )
    SELECT equivalency.transfer_course_equivalency_id,
           local_course.course_id
    FROM desired_transfer_mappings
    JOIN all_target_institutions ati
      ON ati.code = desired_transfer_mappings.institution_code
    JOIN all_target_equivalencies equivalency
      ON equivalency.transfer_institution_id = ati.transfer_institution_id
     AND equivalency.external_subject_code = desired_transfer_mappings.external_subject_code
     AND equivalency.external_course_number = desired_transfer_mappings.external_course_number
    JOIN academic_subject local_subject
      ON local_subject.code = desired_transfer_mappings.local_subject_code
    JOIN course local_course
      ON local_course.subject_id = local_subject.subject_id
     AND local_course.course_number = desired_transfer_mappings.local_course_number
    ON CONFLICT ON CONSTRAINT uq_transfer_course_equivalency_course DO NOTHING
    RETURNING transfer_course_equivalency_course_id
),
desired_transfer_credits(
    target_alt_id,
    institution_code,
    external_term_label,
    transcript_sort_date,
    external_subject_code,
    external_course_number,
    external_course_title,
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
            'SEC-2029',
            'WESTFARTHING',
            'Spring 2026 Transfer Credit',
            '2026-01-19'::date,
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
            'SEC-2029',
            'WESTFARTHING',
            'Fall 2026 Transfer Credit',
            '2026-08-24'::date,
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
            'SEC-2029',
            'WESTFARTHING',
            'Fall 2026 Transfer Credit',
            '2026-08-24'::date,
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
            'SEC-2029',
            'BLUE_MOUNTAIN',
            'Summer 2027 Transfer Credit',
            '2027-06-05'::date,
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
        ),
        (
            'STU-1001',
            'WESTFARTHING',
            'Spring 2026 Transfer Credit',
            '2026-01-19'::date,
            'LIT',
            '101',
            'Introduction to Legends',
            'P',
            3.00,
            3.00,
            0.00,
            0.00,
            FALSE,
            'Samwise tracker seed: the only Sam transfer credit, satisfying TOLK 101 as a prerequisite.'
        )
)
INSERT INTO student_transfer_credit (
    student_id,
    transfer_institution_id,
    transfer_course_equivalency_id,
    external_term_label,
    transcript_sort_date,
    external_subject_code,
    external_course_number,
    external_course_title,
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
       equivalency.transfer_course_equivalency_id,
       desired_transfer_credits.external_term_label,
       desired_transfer_credits.transcript_sort_date,
       desired_transfer_credits.external_subject_code,
       desired_transfer_credits.external_course_number,
       desired_transfer_credits.external_course_title,
       desired_transfer_credits.transfer_grade_mark,
       desired_transfer_credits.credits_attempted,
       desired_transfer_credits.credits_earned,
       desired_transfer_credits.gpa_credits,
       desired_transfer_credits.quality_points,
       desired_transfer_credits.include_in_gpa,
       desired_transfer_credits.notes
FROM desired_transfer_credits
JOIN target_students ts
  ON (
      desired_transfer_credits.target_alt_id IS NULL
      OR ts.alt_id = desired_transfer_credits.target_alt_id
  )
JOIN all_target_institutions ati
  ON ati.code = desired_transfer_credits.institution_code
LEFT JOIN all_target_equivalencies equivalency
  ON equivalency.transfer_institution_id = ati.transfer_institution_id
 AND equivalency.external_subject_code = desired_transfer_credits.external_subject_code
 AND equivalency.external_course_number = desired_transfer_credits.external_course_number
ON CONFLICT ON CONSTRAINT uq_student_transfer_credit_course DO UPDATE
    SET transcript_sort_date = EXCLUDED.transcript_sort_date,
        transfer_course_equivalency_id = EXCLUDED.transfer_course_equivalency_id,
        external_course_title = EXCLUDED.external_course_title,
        transfer_grade_mark = EXCLUDED.transfer_grade_mark,
        credits_attempted = EXCLUDED.credits_attempted,
        credits_earned = EXCLUDED.credits_earned,
        gpa_credits = EXCLUDED.gpa_credits,
        quality_points = EXCLUDED.quality_points,
        include_in_gpa = EXCLUDED.include_in_gpa,
        notes = EXCLUDED.notes;

WITH desired_transfer_credit_courses(
    target_alt_id,
    institution_code,
    external_term_label,
    external_subject_code,
    external_course_number,
    local_subject_code,
    local_course_number
) AS (
    VALUES
        ('SEC-2029', 'WESTFARTHING', 'Spring 2026 Transfer Credit', 'HIST', '110', 'HIST', '110'),
        ('SEC-2029', 'WESTFARTHING', 'Fall 2026 Transfer Credit', 'WRT', '101', 'WRT', '101'),
        ('SEC-2029', 'WESTFARTHING', 'Fall 2026 Transfer Credit', 'MATH', '120', 'MATH', '120'),
        ('SEC-2029', 'BLUE_MOUNTAIN', 'Summer 2027 Transfer Credit', 'BIO', '150', 'BIO', '150'),
        ('STU-1001', 'WESTFARTHING', 'Spring 2026 Transfer Credit', 'LIT', '101', 'TOLK', '101')
)
INSERT INTO student_transfer_credit_course (
    student_transfer_credit_id,
    course_id
)
SELECT stc.student_transfer_credit_id,
       equivalency_course.course_id
FROM student_transfer_credit stc
JOIN transfer_course_equivalency_course equivalency_course
  ON equivalency_course.transfer_course_equivalency_id = stc.transfer_course_equivalency_id
WHERE stc.transfer_course_equivalency_id IS NOT NULL

UNION

SELECT stc.student_transfer_credit_id,
       local_course.course_id
FROM student_transfer_credit stc
JOIN student target_student
  ON target_student.student_id = stc.student_id
JOIN transfer_institution institution
  ON institution.transfer_institution_id = stc.transfer_institution_id
JOIN desired_transfer_credit_courses
  ON desired_transfer_credit_courses.target_alt_id = target_student.alt_id
 AND desired_transfer_credit_courses.institution_code = institution.code
 AND desired_transfer_credit_courses.external_term_label = stc.external_term_label
 AND desired_transfer_credit_courses.external_subject_code = stc.external_subject_code
 AND desired_transfer_credit_courses.external_course_number = stc.external_course_number
JOIN academic_subject local_subject
  ON local_subject.code = desired_transfer_credit_courses.local_subject_code
JOIN course local_course
  ON local_course.subject_id = local_subject.subject_id
 AND local_course.course_number = desired_transfer_credit_courses.local_course_number
ON CONFLICT ON CONSTRAINT uq_student_transfer_credit_course_equivalency DO NOTHING;
