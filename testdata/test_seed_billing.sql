-- Billing seed data for local development and manual testing.

WITH seed_tuition_codes(code, name) AS (
    VALUES
        ('FULL', 'Full Tuition'),
        ('PART', 'Part-Time Tuition'),
        ('AUDIT', 'Audit Tuition'),
        ('WAIVER', 'Tuition Waiver'),
        ('GRAD', 'Graduate Tuition'),
        ('SEM', 'Seminary Tuition')
),
admin_user AS (
    SELECT id
    FROM users
    WHERE email = 'frodo@shire.me'
)
INSERT INTO tuition_code (
    code,
    name,
    created_by_user_id,
    updated_by_user_id
)
SELECT seed_tuition_codes.code,
       seed_tuition_codes.name,
       admin_user.id,
       admin_user.id
FROM seed_tuition_codes
CROSS JOIN admin_user
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    updated_by_user_id = EXCLUDED.updated_by_user_id;

DELETE FROM billing_period_run run
USING billing_period period
WHERE run.billing_period_id = period.billing_period_id
  AND period.name IN ('2025FA', '2026SP', '2026FA', '2027SP');

WITH admin_user AS (
    SELECT id
    FROM users
    WHERE email = 'frodo@shire.me'
),
desired_periods(
    name,
    description,
    type,
    status,
    academic_year_code,
    term_code,
    start_date,
    end_date,
    actual_start_preliminary_end_date,
    tax_academic_year,
    tax_academic_year_label,
    tax_academic_term_code,
    tax_academic_term_name,
    financial_aid_period_code,
    financial_aid_period_name,
    course_billing_basis,
    non_course_billing_basis,
    actual_from_to_days,
    preliminary_from_to_days,
    active,
    allow_re_billing,
    allow_ar_billing,
    include_in_ar_statements,
    allow_billing_in_campus_portal,
    run_prelim_in_campus_portal_only,
    academic_records_mapped,
    children_assigned
) AS (
    VALUES
        (
            '2025FA',
            'Fall 2025 billing',
            'STANDARD',
            'ARCHIVED',
            'AY-2025-2026',
            'FALL-2025-2026',
            '2025-08-25'::date,
            '2025-12-12'::date,
            '2025-08-18'::date,
            '2025',
            '2025-2026',
            'FA',
            'Fall',
            'FA2025',
            'Fall 2025 Aid',
            'BILLING_PERIOD_START_DATE',
            'BILLING_PERIOD_START_DATE',
            0,
            -7,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            FALSE,
            FALSE,
            TRUE,
            TRUE
        ),
        (
            '2026SP',
            'Spring 2026 billing',
            'STANDARD',
            'PUBLISHED',
            'AY-2025-2026',
            'SPRING-2025-2026',
            '2026-01-20'::date,
            '2026-06-05'::date,
            '2026-01-13'::date,
            '2026',
            '2025-2026',
            'SP',
            'Spring',
            'SP2026',
            'Spring 2026 Aid',
            'BILLING_PERIOD_START_DATE',
            'BILLING_PERIOD_START_DATE',
            0,
            -7,
            TRUE,
            FALSE,
            TRUE,
            TRUE,
            FALSE,
            FALSE,
            TRUE,
            FALSE
        ),
        (
            '2026FA',
            'Fall 2026 billing',
            'STANDARD',
            'DRAFT',
            'AY-2026-2027',
            'FALL-2026-2027',
            '2026-08-24'::date,
            '2026-12-11'::date,
            '2026-08-17'::date,
            '2026',
            '2026-2027',
            'FA',
            'Fall',
            'FA2026',
            'Fall 2026 Aid',
            'BILLING_PERIOD_START_DATE',
            'ACTUAL_START_PRELIMINARY_END_DATE',
            0,
            -10,
            TRUE,
            FALSE,
            TRUE,
            FALSE,
            FALSE,
            TRUE,
            FALSE,
            FALSE
        ),
        (
            '2027SP',
            'Spring 2027 billing',
            'OPEN_ENDED',
            'DRAFT',
            'AY-2026-2027',
            'SPRING-2026-2027',
            '2027-01-19'::date,
            '2027-05-07'::date,
            '2027-01-12'::date,
            '2027',
            '2026-2027',
            'SP',
            'Spring',
            'SP2027',
            'Spring 2027 Aid',
            'BILLING_PERIOD_START_DATE',
            'BILLING_PERIOD_END_DATE',
            0,
            -14,
            TRUE,
            FALSE,
            TRUE,
            FALSE,
            TRUE,
            FALSE,
            FALSE,
            FALSE
        )
)
INSERT INTO billing_period (
    name,
    description,
    type,
    status,
    academic_year_id,
    term_id,
    start_date,
    end_date,
    actual_start_preliminary_end_date,
    tax_academic_year,
    tax_academic_year_label,
    tax_academic_term_code,
    tax_academic_term_name,
    financial_aid_period_code,
    financial_aid_period_name,
    course_billing_basis,
    non_course_billing_basis,
    actual_from_to_days,
    preliminary_from_to_days,
    active,
    allow_re_billing,
    allow_ar_billing,
    include_in_ar_statements,
    allow_billing_in_campus_portal,
    run_prelim_in_campus_portal_only,
    academic_records_mapped,
    children_assigned,
    created_by_user_id,
    updated_by_user_id
)
SELECT desired_periods.name,
       desired_periods.description,
       desired_periods.type,
       desired_periods.status,
       academic_year.academic_year_id,
       academic_term.term_id,
       desired_periods.start_date,
       desired_periods.end_date,
       desired_periods.actual_start_preliminary_end_date,
       desired_periods.tax_academic_year,
       desired_periods.tax_academic_year_label,
       desired_periods.tax_academic_term_code,
       desired_periods.tax_academic_term_name,
       desired_periods.financial_aid_period_code,
       desired_periods.financial_aid_period_name,
       desired_periods.course_billing_basis,
       desired_periods.non_course_billing_basis,
       desired_periods.actual_from_to_days,
       desired_periods.preliminary_from_to_days,
       desired_periods.active,
       desired_periods.allow_re_billing,
       desired_periods.allow_ar_billing,
       desired_periods.include_in_ar_statements,
       desired_periods.allow_billing_in_campus_portal,
       desired_periods.run_prelim_in_campus_portal_only,
       desired_periods.academic_records_mapped,
       desired_periods.children_assigned,
       admin_user.id,
       admin_user.id
FROM desired_periods
JOIN academic_year ON academic_year.code = desired_periods.academic_year_code
JOIN academic_term ON academic_term.academic_year_id = academic_year.academic_year_id
                  AND academic_term.code = desired_periods.term_code
CROSS JOIN admin_user
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    academic_year_id = EXCLUDED.academic_year_id,
    term_id = EXCLUDED.term_id,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    actual_start_preliminary_end_date = EXCLUDED.actual_start_preliminary_end_date,
    tax_academic_year = EXCLUDED.tax_academic_year,
    tax_academic_year_label = EXCLUDED.tax_academic_year_label,
    tax_academic_term_code = EXCLUDED.tax_academic_term_code,
    tax_academic_term_name = EXCLUDED.tax_academic_term_name,
    financial_aid_period_code = EXCLUDED.financial_aid_period_code,
    financial_aid_period_name = EXCLUDED.financial_aid_period_name,
    course_billing_basis = EXCLUDED.course_billing_basis,
    non_course_billing_basis = EXCLUDED.non_course_billing_basis,
    actual_from_to_days = EXCLUDED.actual_from_to_days,
    preliminary_from_to_days = EXCLUDED.preliminary_from_to_days,
    active = EXCLUDED.active,
    allow_re_billing = EXCLUDED.allow_re_billing,
    allow_ar_billing = EXCLUDED.allow_ar_billing,
    include_in_ar_statements = EXCLUDED.include_in_ar_statements,
    allow_billing_in_campus_portal = EXCLUDED.allow_billing_in_campus_portal,
    run_prelim_in_campus_portal_only = EXCLUDED.run_prelim_in_campus_portal_only,
    academic_records_mapped = EXCLUDED.academic_records_mapped,
    children_assigned = EXCLUDED.children_assigned,
    updated_by_user_id = EXCLUDED.updated_by_user_id;

WITH admin_user AS (
    SELECT id
    FROM users
    WHERE email = 'frodo@shire.me'
),
desired_runs(
    billing_period_name,
    status,
    billing_period_status_at_run,
    started_at,
    completed_at,
    trigger_source,
    message
) AS (
    VALUES
        (
            '2025FA',
            'COMPLETED',
            'PUBLISHED',
            '2025-08-18 08:15:00'::timestamp,
            '2025-08-18 08:37:00'::timestamp,
            'USER',
            'Seeded completed run for Fall 2025.'
        ),
        (
            '2025FA',
            'FAILED',
            'DRAFT',
            '2025-08-15 14:10:00'::timestamp,
            '2025-08-15 14:12:00'::timestamp,
            'USER',
            'Seeded failed draft run before aid period mapping was corrected.'
        ),
        (
            '2026SP',
            'COMPLETED',
            'PUBLISHED',
            '2026-01-13 07:45:00'::timestamp,
            '2026-01-13 08:09:00'::timestamp,
            'SYSTEM',
            'Seeded automated preliminary billing run.'
        ),
        (
            '2026SP',
            'QUEUED',
            'PUBLISHED',
            NULL::timestamp,
            NULL::timestamp,
            'USER',
            'Seeded queued rerun for manual review.'
        ),
        (
            '2026FA',
            'RUNNING',
            'DRAFT',
            '2026-08-10 09:00:00'::timestamp,
            NULL::timestamp,
            'SYSTEM',
            'Seeded in-progress draft calculation.'
        )
)
INSERT INTO billing_period_run (
    billing_period_id,
    status,
    billing_period_status_at_run,
    started_at,
    completed_at,
    trigger_source,
    triggered_by_user_id,
    message,
    created_by_user_id,
    updated_by_user_id
)
SELECT billing_period.billing_period_id,
       desired_runs.status,
       desired_runs.billing_period_status_at_run,
       desired_runs.started_at,
       desired_runs.completed_at,
       desired_runs.trigger_source,
       CASE WHEN desired_runs.trigger_source = 'USER' THEN admin_user.id ELSE NULL END,
       desired_runs.message,
       admin_user.id,
       admin_user.id
FROM desired_runs
JOIN billing_period ON billing_period.name = desired_runs.billing_period_name
CROSS JOIN admin_user;
