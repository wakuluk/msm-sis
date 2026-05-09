export type TeachingScheduleSubTerm = {
  code: string;
  endDate: string;
  id: number;
  name: string;
  startDate: string;
};

export type TeachingScheduleTerm = {
  academicYearName: string;
  code: string;
  endDate: string;
  id: number;
  name: string;
  startDate: string;
  subTerms: TeachingScheduleSubTerm[];
};

export type TeachingScheduleMeeting = {
  building: string;
  color: string;
  courseCode: string;
  courseTitle: string;
  enrolled: number;
  end: string;
  hardCapacity: number;
  id: string;
  location: string;
  modality: string;
  sectionCode: string;
  softCapacity: number;
  start: string;
  subTermCode: string;
  subTermName: string;
};

export type TeachingScheduleDetail = {
  academicYears: string[];
  generatedAt: string;
  instructor: {
    department: string;
    email: string;
    id: number;
    name: string;
    school: string;
    title: string;
  };
  selectedAcademicYearName: string;
  selectedTermId: number;
  terms: TeachingScheduleTerm[];
  weekStart: string;
  meetings: TeachingScheduleMeeting[];
};

export type TeachingScheduleSearchResult = {
  academicYearName: string;
  departmentName: string;
  instructorEmail: string;
  instructorName: string;
  meetingType: string;
  scheduleId: number;
  schoolName: string;
  sectionCount: number;
  subTermName: string;
  termName: string;
  weeklyMeetingCount: number;
};

export const teachingScheduleMock: TeachingScheduleDetail = {
  academicYears: ['2025-2026', '2026-2027', '2027-2028'],
  generatedAt: '2026-05-08T09:00:00Z',
  instructor: {
    id: 31,
    name: 'Gandalf Mithrandir',
    email: 'gandalf@valinor.edu',
    title: 'Professor of History',
    school: 'School of Historical Studies',
    department: 'History',
  },
  selectedAcademicYearName: '2026-2027',
  selectedTermId: 202610,
  weekStart: '2026-09-14',
  terms: [
    {
      academicYearName: '2026-2027',
      id: 202610,
      code: '2026-FA',
      name: 'Fall 2026',
      startDate: '2026-08-24',
      endDate: '2026-12-18',
      subTerms: [
        {
          id: 202611,
          code: 'FULL',
          name: 'Full Term',
          startDate: '2026-08-24',
          endDate: '2026-12-18',
        },
        {
          id: 202612,
          code: 'A',
          name: 'Session A',
          startDate: '2026-08-24',
          endDate: '2026-10-16',
        },
        {
          id: 202613,
          code: 'B',
          name: 'Session B',
          startDate: '2026-10-19',
          endDate: '2026-12-18',
        },
        {
          id: 202614,
          code: 'WIN',
          name: 'Winter Intensive',
          startDate: '2027-01-04',
          endDate: '2027-01-15',
        },
      ],
    },
    {
      academicYearName: '2026-2027',
      id: 202620,
      code: '2027-SP',
      name: 'Spring 2027',
      startDate: '2027-01-19',
      endDate: '2027-05-07',
      subTerms: [
        {
          id: 202621,
          code: 'FULL',
          name: 'Full Term',
          startDate: '2027-01-19',
          endDate: '2027-05-07',
        },
        {
          id: 202622,
          code: 'A',
          name: 'Session A',
          startDate: '2027-01-19',
          endDate: '2027-03-12',
        },
        {
          id: 202623,
          code: 'B',
          name: 'Session B',
          startDate: '2027-03-15',
          endDate: '2027-05-07',
        },
      ],
    },
  ],
  meetings: [
    {
      id: 'hist-201-m',
      courseCode: 'HIST 201',
      courseTitle: 'Histories of the Second Age',
      sectionCode: '01',
      subTermCode: 'FULL',
      subTermName: 'Full Term',
      start: '2026-09-14T09:00:00',
      end: '2026-09-14T10:15:00',
      location: 'Minas Tirith 204',
      building: 'Minas Tirith',
      modality: 'In person',
      enrolled: 22,
      softCapacity: 24,
      hardCapacity: 28,
      color: '#1c7ed6',
    },
    {
      id: 'hum-140-m',
      courseCode: 'HUM 140',
      courseTitle: 'Languages and Lore',
      sectionCode: 'A1',
      subTermCode: 'A',
      subTermName: 'Session A',
      start: '2026-09-14T09:30:00',
      end: '2026-09-14T10:45:00',
      location: 'Rivendell Hall 110',
      building: 'Rivendell Hall',
      modality: 'In person',
      enrolled: 18,
      softCapacity: 20,
      hardCapacity: 22,
      color: '#f08c00',
    },
    {
      id: 'hist-201-w',
      courseCode: 'HIST 201',
      courseTitle: 'Histories of the Second Age',
      sectionCode: '01',
      subTermCode: 'FULL',
      subTermName: 'Full Term',
      start: '2026-09-16T09:00:00',
      end: '2026-09-16T10:15:00',
      location: 'Minas Tirith 204',
      building: 'Minas Tirith',
      modality: 'In person',
      enrolled: 22,
      softCapacity: 24,
      hardCapacity: 28,
      color: '#1c7ed6',
    },
    {
      id: 'hist-480-r',
      courseCode: 'HIST 480',
      courseTitle: 'Archive Practicum',
      sectionCode: '01',
      subTermCode: 'FULL',
      subTermName: 'Full Term',
      start: '2026-09-17T13:00:00',
      end: '2026-09-17T15:30:00',
      location: 'Library Archive B',
      building: 'Main Library',
      modality: 'Hybrid',
      enrolled: 8,
      softCapacity: 10,
      hardCapacity: 12,
      color: '#2f9e44',
    },
    {
      id: 'hist-620-f',
      courseCode: 'HIST 620',
      courseTitle: 'Graduate Historiography',
      sectionCode: 'B1',
      subTermCode: 'B',
      subTermName: 'Session B',
      start: '2026-09-18T11:00:00',
      end: '2026-09-18T12:30:00',
      location: 'Online',
      building: 'Virtual',
      modality: 'Online synchronous',
      enrolled: 12,
      softCapacity: 14,
      hardCapacity: 16,
      color: '#7048e8',
    },
  ],
};

export const teachingScheduleSearchResultsMock: TeachingScheduleSearchResult[] = [
  {
    scheduleId: 31,
    instructorName: 'Gandalf Mithrandir',
    instructorEmail: 'gandalf@valinor.edu',
    schoolName: 'School of Historical Studies',
    departmentName: 'History',
    academicYearName: '2026-2027',
    termName: 'Fall 2026',
    subTermName: 'Full Term',
    meetingType: 'In person',
    sectionCount: 3,
    weeklyMeetingCount: 4,
  },
  {
    scheduleId: 32,
    instructorName: 'Elrond Peredhel',
    instructorEmail: 'elrond@rivendell.edu',
    schoolName: 'School of Lore and Letters',
    departmentName: 'Humanities',
    academicYearName: '2026-2027',
    termName: 'Fall 2026',
    subTermName: 'Session A',
    meetingType: 'Hybrid',
    sectionCount: 2,
    weeklyMeetingCount: 3,
  },
  {
    scheduleId: 33,
    instructorName: 'Galadriel Artanis',
    instructorEmail: 'galadriel@lorien.edu',
    schoolName: 'School of Lore and Letters',
    departmentName: 'Humanities',
    academicYearName: '2026-2027',
    termName: 'Spring 2027',
    subTermName: 'Full Term',
    meetingType: 'Online synchronous',
    sectionCount: 1,
    weeklyMeetingCount: 2,
  },
  {
    scheduleId: 34,
    instructorName: 'Radagast Brown',
    instructorEmail: 'radagast@rhosgobel.edu',
    schoolName: 'School of Natural Studies',
    departmentName: 'Environmental Studies',
    academicYearName: '2027-2028',
    termName: 'Fall 2027',
    subTermName: 'Full Term',
    meetingType: 'In person',
    sectionCount: 4,
    weeklyMeetingCount: 6,
  },
];
