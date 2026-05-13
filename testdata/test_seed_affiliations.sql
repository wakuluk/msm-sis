-- Honors and athletics affiliation seed data for local development and manual testing.

WITH seed_sports(code, name, active) AS (
    VALUES
        ('MBB', 'Men''s Basketball', TRUE),
        ('WBB', 'Women''s Basketball', TRUE),
        ('WSOC', 'Women''s Soccer', TRUE),
        ('MSOC', 'Men''s Soccer', TRUE),
        ('XC', 'Cross Country', TRUE),
        ('TF', 'Track and Field', TRUE),
        ('SWIM', 'Swimming', TRUE),
        ('FENC', 'Fencing', TRUE),
        ('ARCH', 'Archery', TRUE),
        ('ROW', 'Rowing', FALSE)
),
admin_user AS (
    SELECT id
    FROM users
    WHERE email = 'frodo@shire.me'
)
INSERT INTO athletic_sport (
    code,
    name,
    active,
    updated_by_user_id
)
SELECT seed_sports.code,
       seed_sports.name,
       seed_sports.active,
       admin_user.id
FROM seed_sports
CROSS JOIN admin_user
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    active = EXCLUDED.active,
    updated_by_user_id = EXCLUDED.updated_by_user_id;

WITH seed_honors(student_email, active) AS (
    VALUES
        ('samwise@shire.me', TRUE),
        ('pippin@shire.me', TRUE),
        ('merry@shire.me', FALSE),
        ('rosie.cotton@shire.me', TRUE),
        ('diamond.longcleeve@shire.me', TRUE),
        ('bergil@gondor.me', TRUE),
        ('eowyn@rohan.me', TRUE),
        ('arwen@rivendell.me', TRUE),
        ('elladan@rivendell.me', TRUE),
        ('dwalin@erebor.me', TRUE),
        ('ori@erebor.me', TRUE),
        ('tauriel@mirkwood.me', TRUE),
        ('lobelia.sackville@shire.me', FALSE),
        ('theoden@rohan.me', FALSE),
        ('galadriel@lorien.me', FALSE)
),
admin_user AS (
    SELECT id
    FROM users
    WHERE email = 'frodo@shire.me'
)
INSERT INTO student_honors (
    student_id,
    active,
    updated_by_user_id
)
SELECT student.student_id,
       seed_honors.active,
       admin_user.id
FROM seed_honors
JOIN student
    ON lower(student.email) = lower(seed_honors.student_email)
CROSS JOIN admin_user
ON CONFLICT (student_id) DO UPDATE
SET active = EXCLUDED.active,
    updated_by_user_id = EXCLUDED.updated_by_user_id;

WITH seed_athletes(student_email, sport_code, active) AS (
    VALUES
        ('samwise@shire.me', 'XC', TRUE),
        ('merry@shire.me', 'MBB', TRUE),
        ('pippin@shire.me', 'TF', TRUE),
        ('gimli@erebor.me', 'ROW', FALSE),
        ('rosie.cotton@shire.me', 'WSOC', TRUE),
        ('fatty.bolger@shire.me', 'MBB', TRUE),
        ('folco.boffin@shire.me', 'XC', TRUE),
        ('diamond.longcleeve@shire.me', 'SWIM', TRUE),
        ('estella.bolger@shire.me', 'WBB', TRUE),
        ('fredegar.bolger@shire.me', 'TF', TRUE),
        ('bergil@gondor.me', 'ARCH', TRUE),
        ('eowyn@rohan.me', 'FENC', TRUE),
        ('eomer@rohan.me', 'MSOC', TRUE),
        ('arwen@rivendell.me', 'WSOC', TRUE),
        ('elladan@rivendell.me', 'XC', TRUE),
        ('elrohir@rivendell.me', 'SWIM', TRUE),
        ('tauriel@mirkwood.me', 'ARCH', TRUE),
        ('dain@erebor.me', 'ROW', FALSE)
),
admin_user AS (
    SELECT id
    FROM users
    WHERE email = 'frodo@shire.me'
)
INSERT INTO student_athlete (
    student_id,
    athletic_sport_id,
    active,
    updated_by_user_id
)
SELECT student.student_id,
       athletic_sport.athletic_sport_id,
       seed_athletes.active,
       admin_user.id
FROM seed_athletes
JOIN student
    ON lower(student.email) = lower(seed_athletes.student_email)
JOIN athletic_sport
    ON athletic_sport.code = seed_athletes.sport_code
CROSS JOIN admin_user
ON CONFLICT (student_id, athletic_sport_id) DO UPDATE
SET active = EXCLUDED.active,
    updated_by_user_id = EXCLUDED.updated_by_user_id;
