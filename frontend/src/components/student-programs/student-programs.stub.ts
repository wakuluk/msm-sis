import type {
  CourseVersionPreview,
  PlannerYearPreview,
  StudentProgramPreview,
} from './student-programs.types';

export const initialStudentProgramPreviews: StudentProgramPreview[] = [
  {
    code: 'CORE-UG',
    name: 'Undergraduate Core Curriculum',
    completed: 4,
    planned: 7,
    required: 17,
    status: 'Included',
    type: 'Core',
    version: 'Class of 2028',
    requirements: [
      {
        label: 'Humanities electives',
        completed: 3,
        planned: 6,
        required: 9,
        rules: ['Choose 3 courses from the approved humanities elective list.'],
        unit: 'credits',
        courses: [
          { code: 'HUM 110', status: 'complete' },
          { code: 'PHIL 205', status: 'planned' },
          { code: 'LIT 240', status: 'planned' },
        ],
      },
      {
        label: 'Foundations seminar',
        completed: 1,
        planned: 1,
        required: 2,
        rules: ['Complete CORE 101 and CORE 201.'],
        unit: 'courses',
        courses: [
          { code: 'CORE 101', status: 'complete' },
          { code: 'CORE 201', status: 'planned' },
        ],
      },
      {
        label: 'Language and culture',
        completed: 0,
        planned: 3,
        required: 6,
        rules: ['Complete 6 credits in one language sequence.'],
        unit: 'credits',
        courses: [
          { code: 'ELV 101', status: 'planned' },
          { code: 'ELV 102', status: 'needed' },
        ],
      },
    ],
  },
  {
    code: 'HIST-BA',
    name: 'History BA',
    completed: 16,
    planned: 9,
    required: 33,
    status: 'Declared',
    type: 'Major',
    version: '2026 requirements',
    requirements: [
      {
        label: 'History core',
        completed: 6,
        planned: 3,
        required: 12,
        rules: ['Complete the required History core course sequence.'],
        unit: 'credits',
        courses: [
          { code: 'HIST 201', status: 'complete' },
          { code: 'HIST 240', status: 'complete' },
          { code: 'HIST 301', status: 'planned' },
          { code: 'HIST 302', status: 'needed' },
        ],
      },
      {
        label: 'Upper-level seminars',
        completed: 1,
        planned: 1,
        required: 3,
        rules: ['Choose 2 courses at the 400 level in HIST.'],
        unit: 'courses',
        courses: [
          { code: 'HIST 410', status: 'complete' },
          { code: 'HIST 425', status: 'planned' },
          { code: 'HIST 480', status: 'needed' },
        ],
      },
      {
        label: 'Major electives',
        completed: 9,
        planned: 6,
        required: 18,
        rules: ['Complete 18 elective credits in HIST at the 300 level or higher.'],
        unit: 'credits',
        courses: [
          { code: 'HIST 310', status: 'complete' },
          { code: 'HIST 330', status: 'complete' },
          { code: 'HIST 350', status: 'planned' },
          { code: 'HIST 390', status: 'planned' },
        ],
      },
    ],
  },
];

export const courseVersionPreviews: Record<string, CourseVersionPreview> = {
  'CORE 101': {
    code: 'CORE 101',
    credits: 3,
    description: 'Introduces college-level inquiry, academic planning, and reflective practice.',
    effectiveYear: '2026-2027',
    prerequisites: [],
    title: 'Foundations Seminar I',
    version: 'Latest published version',
  },
  'CORE 201': {
    code: 'CORE 201',
    credits: 3,
    description: 'Builds on the first-year seminar with applied research and advising milestones.',
    effectiveYear: '2026-2027',
    prerequisites: [{ code: 'CORE 101', note: 'Must be completed first.', status: 'satisfied' }],
    title: 'Foundations Seminar II',
    version: 'Latest published version',
  },
  'ELV 102': {
    code: 'ELV 102',
    credits: 3,
    description: 'Continues the elementary language sequence with culture and composition work.',
    effectiveYear: '2026-2027',
    prerequisites: [{ code: 'ELV 101', note: 'Planned before this course.', status: 'planned' }],
    title: 'Elementary Language II',
    version: 'Latest published version',
  },
  'HIST 302': {
    code: 'HIST 302',
    credits: 3,
    description: 'Advanced historical methods with source analysis and historiography.',
    effectiveYear: '2026-2027',
    prerequisites: [
      { code: 'HIST 201', note: 'Completed in Year 1 Spring.', status: 'satisfied' },
      { code: 'HIST 301', note: 'Planned before this course.', status: 'planned' },
    ],
    title: 'Historical Methods II',
    version: 'Latest published version',
  },
  'HIST 480': {
    code: 'HIST 480',
    credits: 3,
    description: 'Senior seminar focused on independent research and presentation.',
    effectiveYear: '2026-2027',
    prerequisites: [
      { code: 'HIST 301', note: 'Planned before this course.', status: 'planned' },
      { code: 'HIST 302', note: 'Not planned yet.', status: 'missing' },
    ],
    title: 'Senior Research Seminar',
    version: 'Latest published version',
  },
};

export const plannerTermLabels = ['Fall', 'Spring', 'Summer I', 'Summer II'];

export const initialPlannerYears: PlannerYearPreview[] = [
  {
    label: 'Year 1',
    terms: [
      {
        code: 'year-1-fall',
        isComplete: true,
        label: 'Fall',
        courses: [
          {
            code: 'CORE 101',
            credits: 3,
            requirement: 'Foundations seminar',
            status: 'complete',
          },
          {
            code: 'HUM 110',
            credits: 3,
            requirement: 'Humanities electives',
            status: 'complete',
          },
        ],
      },
      {
        code: 'year-1-spring',
        isComplete: true,
        label: 'Spring',
        courses: [
          {
            code: 'HIST 201',
            credits: 3,
            requirement: 'History core',
            status: 'complete',
          },
          {
            code: 'HIST 240',
            credits: 3,
            requirement: 'History core',
            status: 'complete',
          },
        ],
      },
      { code: 'year-1-summer-i', label: 'Summer I', courses: [] },
      { code: 'year-1-summer-ii', label: 'Summer II', courses: [] },
    ],
  },
  {
    label: 'Year 2',
    terms: [
      {
        code: 'year-2-fall',
        label: 'Fall',
        courses: [
          {
            code: 'HIST 301',
            credits: 3,
            requirement: 'History core',
            status: 'planned',
          },
          {
            code: 'PHIL 205',
            credits: 3,
            requirement: 'Humanities electives',
            status: 'planned',
          },
        ],
      },
      {
        code: 'year-2-spring',
        label: 'Spring',
        courses: [
          {
            code: 'CORE 201',
            credits: 3,
            requirement: 'Foundations seminar',
            status: 'planned',
          },
          {
            code: 'HIST 350',
            credits: 3,
            requirement: 'Major electives',
            status: 'planned',
          },
        ],
      },
      { code: 'year-2-summer-i', label: 'Summer I', courses: [] },
      { code: 'year-2-summer-ii', label: 'Summer II', courses: [] },
    ],
  },
  {
    label: 'Year 3',
    terms: [
      {
        code: 'year-3-fall',
        label: 'Fall',
        courses: [
          {
            code: 'HIST 425',
            credits: 3,
            requirement: 'Upper-level seminars',
            status: 'planned',
          },
          {
            code: 'LIT 240',
            credits: 3,
            requirement: 'Humanities electives',
            status: 'planned',
          },
        ],
      },
      { code: 'year-3-spring', label: 'Spring', courses: [] },
      { code: 'year-3-summer-i', label: 'Summer I', courses: [] },
      { code: 'year-3-summer-ii', label: 'Summer II', courses: [] },
    ],
  },
  {
    label: 'Year 4',
    terms: [
      { code: 'year-4-fall', label: 'Fall', courses: [] },
      { code: 'year-4-spring', label: 'Spring', courses: [] },
      { code: 'year-4-summer-i', label: 'Summer I', courses: [] },
      { code: 'year-4-summer-ii', label: 'Summer II', courses: [] },
    ],
  },
];
