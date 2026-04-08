DELETE FROM pdf_documents;
DELETE FROM staff;
DELETE FROM student;
DELETE FROM address;
DELETE FROM class_standing;
DELETE FROM ethnicity;
DELETE FROM user_roles;
DELETE FROM roles;
DELETE FROM users;

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

INSERT INTO address (
    address_id,
    address_line_1,
    address_line_2,
    city,
    state_region,
    postal_code,
    country_code,
    address_type,
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
        'Home',
        '20dcafab005f19de7eedf2d2b353c4ea0cad9642141b3af9cbf98d736e59ff66',
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
        'Home',
        '9cdbe9b9d4b8e2c8780369b276b9430de6419ecd4db8369ea8f6dbe1a913e7dc',
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
        'Home',
        'fa766b0b5b43d3181804e1e72512fa68e9798cd17a7d17cf4928541242659bd6',
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
        'Home',
        '19c7e4f190dc0436509394da365584fe69ab04f2f93eb2805e4feefa8aa0849b',
        'seed-script'
    );

INSERT INTO student (
    first_name,
    last_name,
    middle_name,
    name_suffix,
    gender,
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
        'Male',
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
        'Male',
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
        'Male',
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
        'Male',
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
JOIN users u ON u.email = s.email
SET s.user_id = u.id
WHERE s.email IN (
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
