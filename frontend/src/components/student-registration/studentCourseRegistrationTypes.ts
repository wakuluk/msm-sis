export type StudentRegistrationCourseStatus =
  | 'PRE_REGISTERED'
  | 'WAITLISTED'
  | 'WAITLIST_EXPIRED'
  | 'ENROLLED';

export type StudentRegistrationSubTermView = {
  code: string;
  endDate: string;
  id: number;
  name: string;
  startDate: string;
};

export type StudentRegistrationTermView = {
  academicYearName: string;
  code: string;
  endDate: string;
  id: number;
  name: string;
  startDate: string;
  subTerms: StudentRegistrationSubTermView[];
};

export type StudentRegistrationScheduleMeetingView = {
  color: string;
  courseCode: string;
  dayOfWeek: number;
  endTime: string;
  id: string;
  location: string;
  sectionCode: string;
  startTime: string;
  status: StudentRegistrationCourseStatus;
  subTermCode: string;
  subTermId: number;
  subTermName: string;
  termId: number;
  title: string;
};

export type StudentRegistrationScheduleView = {
  academicYears: string[];
  meetings: StudentRegistrationScheduleMeetingView[];
  selectedAcademicYearName: string;
  selectedTermId: number;
  terms: StudentRegistrationTermView[];
  weekStart: string;
};
