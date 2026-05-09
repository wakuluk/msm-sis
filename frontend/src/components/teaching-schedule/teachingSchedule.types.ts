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
  sectionId?: number;
  softCapacity: number;
  start: string;
  startTime?: string;
  statusCode: string;
  statusName: string;
  dayOfWeek?: number;
  subTermCode: string;
  subTermId?: number;
  subTermName: string;
  termId?: number;
  endTime?: string;
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
