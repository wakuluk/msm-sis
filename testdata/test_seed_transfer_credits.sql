DELETE FROM student_transfer_credit
WHERE student_id IN (
    SELECT student_id
    FROM student
    WHERE alt_id = 'STU-1001'
);

WITH target_institutions(
    code,
    name,
    institution_level,
    address_line_1,
    address_line_2,
    city,
    state_region,
    postal_code,
    country_code,
    website
) AS (
    VALUES
        ('WESTFARTHING', 'Westfarthing Community College', 'TWO_YEAR', '1 West Road', NULL, 'Michel Delving', 'The Shire', '00001', 'US', 'https://westfarthing.example.edu'),
        ('BLUE_MOUNTAIN', 'Blue Mountain College', 'FOUR_YEAR', '9 Stonehall Avenue', NULL, 'Dale', 'Rhovanion', '00009', 'US', 'https://bluemountain.example.edu')
),
upserted_institutions AS (
    INSERT INTO transfer_institution (
        code,
        name,
        institution_level,
        address_line_1,
        address_line_2,
        city,
        state_region,
        postal_code,
        country_code,
        website,
        active
    )
    SELECT code,
           name,
           institution_level,
           address_line_1,
           address_line_2,
           city,
           state_region,
           postal_code,
           country_code,
           website,
           TRUE
    FROM target_institutions
    ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            institution_level = EXCLUDED.institution_level,
            address_line_1 = EXCLUDED.address_line_1,
            address_line_2 = EXCLUDED.address_line_2,
            city = EXCLUDED.city,
            state_region = EXCLUDED.state_region,
            postal_code = EXCLUDED.postal_code,
            country_code = EXCLUDED.country_code,
            website = EXCLUDED.website,
            active = TRUE
    RETURNING transfer_institution_id, code, name, institution_level
),
all_target_institutions AS (
    SELECT transfer_institution_id, code, name, institution_level
    FROM upserted_institutions

    UNION

    SELECT transfer_institution_id, code, name, institution_level
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
    ON CONFLICT (transfer_institution_id, external_subject_code, external_course_number) WHERE active = TRUE DO UPDATE
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
cleared_equivalency_outcomes AS (
    DELETE FROM transfer_course_equivalency_outcome
    WHERE transfer_course_equivalency_id IN (
        SELECT transfer_course_equivalency_id
        FROM all_target_equivalencies
    )
    RETURNING transfer_course_equivalency_outcome_id
),
seeded_equivalency_outcomes AS (
    INSERT INTO transfer_course_equivalency_outcome (
        transfer_course_equivalency_id,
        outcome_type,
        local_course_id,
        accepted_credits,
        notes,
        sort_order
    )
    SELECT equivalency.transfer_course_equivalency_id,
           'COURSE_SUBSTITUTION',
           local_course.course_id,
           CASE
               WHEN desired_transfer_mappings.local_subject_code = 'BIO' THEN 4.00
               ELSE 3.00
           END,
           'Seeded reusable substitution mapping',
           0
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
    RETURNING transfer_course_equivalency_outcome_id
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
    transfer_institution_name_snapshot,
    transfer_institution_level_snapshot,
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
       ati.name,
       ati.institution_level,
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
        transfer_institution_name_snapshot = EXCLUDED.transfer_institution_name_snapshot,
        transfer_institution_level_snapshot = EXCLUDED.transfer_institution_level_snapshot,
        external_course_title = EXCLUDED.external_course_title,
        transfer_grade_mark = EXCLUDED.transfer_grade_mark,
        credits_attempted = EXCLUDED.credits_attempted,
        credits_earned = EXCLUDED.credits_earned,
        gpa_credits = EXCLUDED.gpa_credits,
        quality_points = EXCLUDED.quality_points,
        include_in_gpa = EXCLUDED.include_in_gpa,
        notes = EXCLUDED.notes;

WITH admin_user AS (
    SELECT id
    FROM users
    WHERE email = 'frodo@shire.me'
),
active_transfer_policy AS (
    SELECT transfer_credit_policy_id
    FROM transfer_credit_policy
    WHERE effective_start_date <= CURRENT_DATE
      AND (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE)
    ORDER BY effective_start_date DESC, transfer_credit_policy_id DESC
    LIMIT 1
),
target_request_students AS (
    SELECT student_id, alt_id
    FROM student
    WHERE alt_id IN ('STU-1001', 'SEC-2029')
),
request_saved_institutions AS (
    SELECT transfer_institution_id, code, name, institution_level
    FROM transfer_institution
    WHERE code IN ('WESTFARTHING', 'BLUE_MOUNTAIN')
),
desired_transfer_requests(
    scenario_code,
    alt_id,
    matched_institution_code,
    submitted_at,
    one_off_institution_name,
    one_off_institution_address_line_1,
    one_off_institution_address_line_2,
    one_off_institution_city,
    one_off_institution_state_region,
    one_off_institution_postal_code,
    one_off_institution_country_code,
    one_off_institution_website,
    institution_level,
    external_subject_code,
    external_course_number,
    external_course_title,
    external_course_description,
    external_term,
    requested_credits,
    attempted_credits,
    grade,
    reason,
    student_notes,
    requested_local_course_equivalent,
    local_subject_code,
    local_course_number,
    include_transfer_credit_outcome
) AS (
    VALUES
        (
            'UNMATCHED_ONE_OFF_ONLY',
            'SEC-2029',
            NULL::varchar,
            '2026-05-01 09:00:00'::timestamp,
            'North Moors College',
            '17 Lantern Road',
            NULL::varchar,
            'Bree',
            'Eriador',
            '00017',
            'US',
            'https://northmoors.example.edu',
            'TWO_YEAR',
            'THEO',
            '210',
            'Sacred Texts',
            'Survey of major sacred texts and interpretive traditions.',
            'Summer 2026',
            3.00::numeric,
            3.00::numeric,
            'B',
            'Summer transfer course completed near home.',
            'Please review as general transfer credit. This one is useful for approving without saving the institution.',
            'Elective credit',
            NULL::varchar,
            NULL::varchar,
            TRUE
        ),
        (
            'UNMATCHED_SAVE_INSTITUTION',
            'SEC-2029',
            NULL::varchar,
            '2026-05-02 10:15:00'::timestamp,
            'Southfarthing Institute',
            '42 Greenway Lane',
            'Registrar Suite',
            'Longbottom',
            'The Shire',
            '00042',
            'US',
            'https://southfarthing.example.edu',
            'FOUR_YEAR',
            'LIT',
            '240',
            'Myths and Languages',
            'A literary study of myth-making, invented languages, and medieval source traditions.',
            'Summer 2026',
            3.00::numeric,
            3.00::numeric,
            'A-',
            'Requested for Tolkien studies progress.',
            'This one is useful for approving while saving a brand-new institution and mapping.',
            'TOLK 240',
            'TOLK',
            '240',
            TRUE
        ),
        (
            'MATCHED_UPDATE_MAPPING',
            'STU-1001',
            'WESTFARTHING',
            '2026-05-03 11:30:00'::timestamp,
            'Westfarthing Community College',
            '1 West Road',
            NULL::varchar,
            'Michel Delving',
            'The Shire',
            '00001',
            'US',
            'https://westfarthing.example.edu',
            'TWO_YEAR',
            'LIT',
            '240',
            'Myth and Language',
            'Prior saved mapping has a course substitution; this request adds explicit transfer credit for comparison.',
            'Fall 2026',
            3.00::numeric,
            3.00::numeric,
            'B+',
            'Registrar review of known institution mapping.',
            'This one is useful for previewing previous vs potential mapping update.',
            'TOLK 240',
            'TOLK',
            '240',
            TRUE
        ),
        (
            'MATCHED_KEEP_MAPPING',
            'STU-1001',
            'BLUE_MOUNTAIN',
            '2026-05-04 14:00:00'::timestamp,
            'Blue Mountain College',
            '9 Stonehall Avenue',
            NULL::varchar,
            'Dale',
            'Rhovanion',
            '00009',
            'US',
            'https://bluemountain.example.edu',
            'FOUR_YEAR',
            'MEH',
            '310',
            'Kingship and Stewardship',
            'Upper-level study of kingship, vocation, and stewardship in Middle-earth.',
            'Summer 2026',
            3.00::numeric,
            3.00::numeric,
            'B',
            'Known institution course for transfer review.',
            'This one is useful for approving with a saved institution while leaving mapping update unchecked.',
            'MEH 310',
            'MEH',
            '310',
            TRUE
        )
),
seeded_transfer_requests AS (
    INSERT INTO transfer_request (
        student_id,
        transfer_credit_policy_id,
        transfer_institution_id,
        institution_matched_by_user_id,
        institution_matched_at,
        one_off_institution_name,
        one_off_institution_address_line_1,
        one_off_institution_address_line_2,
        one_off_institution_city,
        one_off_institution_state_region,
        one_off_institution_postal_code,
        one_off_institution_country_code,
        one_off_institution_website,
        institution_level,
        status,
        submitted_at
    )
    SELECT target_request_students.student_id,
           active_transfer_policy.transfer_credit_policy_id,
           request_saved_institutions.transfer_institution_id,
           CASE WHEN request_saved_institutions.transfer_institution_id IS NULL THEN NULL ELSE admin_user.id END,
           CASE WHEN request_saved_institutions.transfer_institution_id IS NULL THEN NULL ELSE desired_transfer_requests.submitted_at + interval '30 minutes' END,
           desired_transfer_requests.one_off_institution_name,
           desired_transfer_requests.one_off_institution_address_line_1,
           desired_transfer_requests.one_off_institution_address_line_2,
           desired_transfer_requests.one_off_institution_city,
           desired_transfer_requests.one_off_institution_state_region,
           desired_transfer_requests.one_off_institution_postal_code,
           desired_transfer_requests.one_off_institution_country_code,
           desired_transfer_requests.one_off_institution_website,
           COALESCE(request_saved_institutions.institution_level, desired_transfer_requests.institution_level),
           'REGISTRAR_REVIEW',
           desired_transfer_requests.submitted_at
    FROM desired_transfer_requests
    JOIN target_request_students
      ON target_request_students.alt_id = desired_transfer_requests.alt_id
    CROSS JOIN active_transfer_policy
    CROSS JOIN admin_user
    LEFT JOIN request_saved_institutions
      ON request_saved_institutions.code = desired_transfer_requests.matched_institution_code
    RETURNING transfer_request_id,
              student_id,
              one_off_institution_name,
              submitted_at
),
request_lookup AS (
    SELECT seeded_transfer_requests.transfer_request_id,
           desired_transfer_requests.*
    FROM seeded_transfer_requests
    JOIN target_request_students
      ON target_request_students.student_id = seeded_transfer_requests.student_id
    JOIN desired_transfer_requests
      ON desired_transfer_requests.alt_id = target_request_students.alt_id
     AND desired_transfer_requests.submitted_at = seeded_transfer_requests.submitted_at
),
seeded_transfer_request_courses AS (
    INSERT INTO transfer_request_course (
        transfer_request_id,
        external_subject_code,
        external_course_number,
        external_course_title,
        external_course_description,
        external_term,
        requested_credits,
        attempted_credits,
        earned_credits,
        grade,
        reason,
        student_notes,
        requested_local_course_equivalent,
        sort_order
    )
    SELECT request_lookup.transfer_request_id,
           request_lookup.external_subject_code,
           request_lookup.external_course_number,
           request_lookup.external_course_title,
           request_lookup.external_course_description,
           request_lookup.external_term,
           request_lookup.requested_credits,
           request_lookup.attempted_credits,
           request_lookup.requested_credits,
           request_lookup.grade,
           request_lookup.reason,
           request_lookup.student_notes,
           request_lookup.requested_local_course_equivalent,
           0
    FROM request_lookup
    RETURNING transfer_request_course_id,
              transfer_request_id
),
request_course_lookup AS (
    SELECT seeded_transfer_request_courses.transfer_request_course_id,
           request_lookup.*
    FROM seeded_transfer_request_courses
    JOIN request_lookup
      ON request_lookup.transfer_request_id = seeded_transfer_request_courses.transfer_request_id
),
seeded_transfer_credit_outcomes AS (
    INSERT INTO transfer_request_outcome (
        transfer_request_course_id,
        outcome_type,
        accepted_credits,
        notes,
        approved_by_user_id,
        approved_at
    )
    SELECT request_course_lookup.transfer_request_course_id,
           'TRANSFER_CREDIT',
           request_course_lookup.requested_credits,
           'Seeded proposed transfer credit outcome.',
           admin_user.id,
           request_course_lookup.submitted_at + interval '1 hour'
    FROM request_course_lookup
    CROSS JOIN admin_user
    WHERE request_course_lookup.include_transfer_credit_outcome
    RETURNING transfer_request_outcome_id
),
seeded_course_substitution_outcomes AS (
    INSERT INTO transfer_request_outcome (
        transfer_request_course_id,
        outcome_type,
        local_course_id,
        accepted_credits,
        notes,
        approved_by_user_id,
        approved_at
    )
    SELECT request_course_lookup.transfer_request_course_id,
           'COURSE_SUBSTITUTION',
           local_course.course_id,
           request_course_lookup.requested_credits,
           'Seeded proposed course substitution outcome.',
           admin_user.id,
           request_course_lookup.submitted_at + interval '1 hour'
    FROM request_course_lookup
    CROSS JOIN admin_user
    JOIN academic_subject local_subject
      ON local_subject.code = request_course_lookup.local_subject_code
    JOIN course local_course
      ON local_course.subject_id = local_subject.subject_id
     AND local_course.course_number = request_course_lookup.local_course_number
    WHERE request_course_lookup.local_subject_code IS NOT NULL
      AND request_course_lookup.local_course_number IS NOT NULL
    RETURNING transfer_request_outcome_id
),
seeded_transfer_request_pdfs AS (
    INSERT INTO pdf_documents (
        file_path,
        original_file_name
    )
    SELECT 'seed/transfer-requests/' || request_lookup.scenario_code || '-transcript.pdf',
           request_lookup.scenario_code || '-transcript.pdf'
    FROM request_lookup
    RETURNING id,
              original_file_name,
              file_path
),
pdf_lookup AS (
    SELECT request_lookup.transfer_request_id,
           seeded_transfer_request_pdfs.id,
           seeded_transfer_request_pdfs.file_path,
           row_number() OVER (ORDER BY request_lookup.submitted_at, request_lookup.scenario_code) AS request_row_number
    FROM request_lookup
    JOIN seeded_transfer_request_pdfs
      ON seeded_transfer_request_pdfs.original_file_name = request_lookup.scenario_code || '-transcript.pdf'
)
INSERT INTO transfer_request_attachment (
    transfer_request_id,
    pdf_document_id,
    storage_key,
    attachment_type,
    uploaded_by_user_id,
    uploaded_at
)
SELECT pdf_lookup.transfer_request_id,
       pdf_lookup.id,
       pdf_lookup.file_path,
       'TRANSCRIPT',
       admin_user.id,
       request_lookup.submitted_at + interval '45 minutes'
FROM pdf_lookup
JOIN request_lookup
  ON request_lookup.transfer_request_id = pdf_lookup.transfer_request_id
CROSS JOIN admin_user;

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
