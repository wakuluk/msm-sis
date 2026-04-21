TRUNCATE TABLE
    pdf_documents,
    staff,
    student,
    address,
    gender,
    class_standing,
    ethnicity,
    user_roles,
    roles,
    users
RESTART IDENTITY CASCADE;

-- Password: Password123
INSERT INTO users (email, password_hash, enabled)
VALUES (
    'frodo@shire.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'samwise@shire.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'merry@shire.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'pippin@shire.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'gimli@erebor.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'gandalf@valinor.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'aragorn@gondor.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'legolas@mirkwood.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
),
(
    'boromir@gondor.me',
    '$argon2id$v=19$m=16384,t=2,p=1$euvZ8L29MjjHzluLVaMllA$AgSCCYqDSXV+aos7IVvNB3IPK3RFW2d9achT5oOs3+I',
    TRUE
);

INSERT INTO ethnicity (ethnicity_id, ethnicity_name)
VALUES
    (1, 'Hobbit'),
    (2, 'Dwarf'),
    (3, 'Elf'),
    (4, 'Man'),
    (5, 'Maia');

INSERT INTO class_standing (class_standing_id, class_standing_name)
VALUES
    (1, 'First Age'),
    (2, 'Second Age'),
    (3, 'Third Age'),
    (4, 'Fourth Age');

INSERT INTO gender (gender_id, gender_name)
VALUES
    (1, 'Male'),
    (2, 'Female'),
    (3, 'Non-binary'),
    (4, 'Prefer not to say');

INSERT INTO address (
    address_id,
    address_line_1,
    address_line_2,
    city,
    state_region,
    postal_code,
    country_code,
    address_lookup_hash,
    updated_by
)
VALUES
    (
        1,
        '3 Bagshot Row',
        NULL,
        'Hobbiton',
        'The Shire',
        NULL,
        NULL,
        '759063cb8653f059bdad31b7c8aae17a8a376267d00fe6efc87fca1b7f590c2b',
        'seed-script'
    ),
    (
        2,
        'Brandy Hall',
        NULL,
        'Bucklebury',
        'Buckland',
        NULL,
        NULL,
        'f81fbff26a6f718270eb346ec2277e42dda2109d83d5fca2e53a0d8429939ce0',
        'seed-script'
    ),
    (
        3,
        'The Great Smials',
        NULL,
        'Tuckborough',
        'Tookland',
        NULL,
        NULL,
        '928a1c9d8eac9f2c99da4aff380d2803d381f0fb5a471195774ea246691b73d1',
        'seed-script'
    ),
    (
        4,
        'Stone Gate',
        NULL,
        'Erebor',
        'Kingdom under the Mountain',
        NULL,
        NULL,
        '1f6baffb47907f8074877f455c01ca538ffa4e58ebd1d9e5d9518a01a25ae357',
        'seed-script'
    );

SELECT setval(pg_get_serial_sequence('ethnicity', 'ethnicity_id'), COALESCE((SELECT MAX(ethnicity_id) FROM ethnicity), 1), TRUE);
SELECT setval(pg_get_serial_sequence('class_standing', 'class_standing_id'), COALESCE((SELECT MAX(class_standing_id) FROM class_standing), 1), TRUE);
SELECT setval(pg_get_serial_sequence('gender', 'gender_id'), COALESCE((SELECT MAX(gender_id) FROM gender), 1), TRUE);
SELECT setval(pg_get_serial_sequence('address', 'address_id'), COALESCE((SELECT MAX(address_id) FROM address), 1), TRUE);

INSERT INTO student (
    first_name,
    last_name,
    middle_name,
    name_suffix,
    gender_id,
    ethnicity_id,
    class_standing_id,
    address_id,
    preferred_name,
    date_of_birth,
    estimated_grad_date,
    alt_id,
    email,
    phone,
    is_disabled,
    updated_by
)
VALUES
    (
        'Samwise',
        'Gamgee',
        NULL,
        NULL,
        1,
        1,
        1,
        1,
        'Sam',
        '1988-04-06',
        '2006-06-01',
        'STU-1001',
        'samwise@shire.me',
        '555-0101',
        FALSE,
        'seed-script'
    ),
    (
        'Meriadoc',
        'Brandybuck',
        'R.',
        NULL,
        1,
        1,
        2,
        2,
        'Merry',
        '1988-10-14',
        '2007-06-01',
        'STU-1002',
        'merry@shire.me',
        '555-0102',
        FALSE,
        'seed-script'
    ),
    (
        'Peregrin',
        'Took',
        NULL,
        'II',
        1,
        1,
        3,
        3,
        'Pippin',
        '1989-03-25',
        '2008-06-01',
        'STU-1003',
        'pippin@shire.me',
        '555-0103',
        FALSE,
        'seed-script'
    ),
    (
        'Gimli',
        'Gloinson',
        NULL,
        NULL,
        1,
        2,
        4,
        4,
        NULL,
        '1987-11-03',
        '2005-06-01',
        'STU-1004',
        'gimli@erebor.me',
        '555-0104',
        FALSE,
        'seed-script'
    );

INSERT INTO roles (name)
VALUES
    ('ADMIN'),
    ('STUDENT');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'ADMIN'
WHERE u.email = 'frodo@shire.me';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'STUDENT'
WHERE u.email IN (
    'samwise@shire.me',
    'merry@shire.me',
    'pippin@shire.me',
    'gimli@erebor.me'
);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'ADMIN'
WHERE u.email IN (
    'gandalf@valinor.me',
    'aragorn@gondor.me',
    'legolas@mirkwood.me',
    'boromir@gondor.me'
);

UPDATE student s
SET user_id = u.id
FROM users u
WHERE u.email = s.email
  AND s.email IN (
    'samwise@shire.me',
    'merry@shire.me',
    'pippin@shire.me',
    'gimli@erebor.me'
);

INSERT INTO staff (user_id, first_name, last_name, email)
SELECT u.id, 'Frodo', 'Baggins', 'frodo@shire.me'
FROM users u
WHERE u.email = 'frodo@shire.me';

INSERT INTO staff (user_id, first_name, last_name, email)
SELECT u.id, 'Gandalf', 'Mithrandir', 'gandalf@valinor.me'
FROM users u
WHERE u.email = 'gandalf@valinor.me';

INSERT INTO staff (user_id, first_name, last_name, email)
SELECT u.id, 'Aragorn', 'Elessar', 'aragorn@gondor.me'
FROM users u
WHERE u.email = 'aragorn@gondor.me';

INSERT INTO staff (user_id, first_name, last_name, email)
SELECT u.id, 'Legolas', 'Greenleaf', 'legolas@mirkwood.me'
FROM users u
WHERE u.email = 'legolas@mirkwood.me';

INSERT INTO staff (user_id, first_name, last_name, email)
SELECT u.id, 'Boromir', 'Denethor', 'boromir@gondor.me'
FROM users u
WHERE u.email = 'boromir@gondor.me';
