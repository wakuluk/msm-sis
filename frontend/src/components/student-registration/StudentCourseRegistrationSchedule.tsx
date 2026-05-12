import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventContentArg, EventInput } from '@fullcalendar/core';
import { Box, Grid, MultiSelect, Text } from '@mantine/core';
import type {
  StudentRegistrationCourseStatus,
  StudentRegistrationScheduleMeetingView,
  StudentRegistrationScheduleView,
  StudentRegistrationSubTermView,
} from './studentCourseRegistrationTypes';
import classes from './StudentCourseRegistrationSchedule.module.css';

type StudentCourseRegistrationScheduleProps = {
  schedule: StudentRegistrationScheduleView;
};

function overlapsDateRange(
  rangeStart: string,
  rangeEnd: string,
  candidateStart: string,
  candidateEnd: string
) {
  return candidateStart <= rangeEnd && candidateEnd >= rangeStart;
}

function getVisibleSubTerms(term: StudentRegistrationScheduleView['terms'][number]) {
  return term.subTerms.filter((subTerm) =>
    overlapsDateRange(term.startDate, term.endDate, subTerm.startDate, subTerm.endDate)
  );
}

function getSubTermSelectionValue(subTerm: StudentRegistrationSubTermView) {
  return String(subTerm.id);
}

function getMeetingSubTermSelectionValue(meeting: StudentRegistrationScheduleMeetingView) {
  return String(meeting.subTermId);
}

function subTermsOverlap(
  firstSubTerm: StudentRegistrationSubTermView,
  secondSubTerm: StudentRegistrationSubTermView
) {
  return overlapsDateRange(
    firstSubTerm.startDate,
    firstSubTerm.endDate,
    secondSubTerm.startDate,
    secondSubTerm.endDate
  );
}

function getCompatibleSubTermCodes(
  subTerms: StudentRegistrationSubTermView[],
  selectedSubTermCodes: string[]
) {
  if (selectedSubTermCodes.length === 0) {
    return new Set(subTerms.map(getSubTermSelectionValue));
  }

  const selectedSubTerms = subTerms.filter((subTerm) =>
    selectedSubTermCodes.includes(getSubTermSelectionValue(subTerm))
  );

  return new Set(
    subTerms
      .filter((candidateSubTerm) =>
        selectedSubTerms.every((selectedSubTerm) =>
          subTermsOverlap(candidateSubTerm, selectedSubTerm)
        )
      )
      .map(getSubTermSelectionValue)
  );
}

function filterCompatibleSubTermSelection(
  subTerms: StudentRegistrationSubTermView[],
  selectedSubTermCodes: string[]
) {
  return selectedSubTermCodes.reduce<string[]>((nextSelection, subTermCode) => {
    const candidateSubTerm = subTerms.find(
      (subTerm) => getSubTermSelectionValue(subTerm) === subTermCode
    );

    if (!candidateSubTerm) {
      return nextSelection;
    }

    const canAddCandidate = nextSelection
      .map((selectedSubTermCode) =>
        subTerms.find((subTerm) => getSubTermSelectionValue(subTerm) === selectedSubTermCode)
      )
      .filter((subTerm): subTerm is StudentRegistrationSubTermView => Boolean(subTerm))
      .every((selectedSubTerm) => subTermsOverlap(candidateSubTerm, selectedSubTerm));

    return canAddCandidate ? [...nextSelection, subTermCode] : nextSelection;
  }, []);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function formatTimeRange(
  startDateTime: string | Date | null | undefined,
  endDateTime: string | Date | null | undefined
) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const startTime = startDateTime ? formatter.format(new Date(startDateTime)) : '';
  const endTime = endDateTime ? formatter.format(new Date(endDateTime)) : '';

  if (!startTime || !endTime) {
    return startTime || endTime;
  }

  return `${startTime} - ${endTime}`;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function getWeekStartForDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const dayOfWeek = date.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  date.setDate(date.getDate() - daysSinceMonday);

  return date.toISOString().slice(0, 10);
}

function getWeekStartForTerm(
  term: StudentRegistrationScheduleView['terms'][number] | undefined,
  fallback: string
) {
  return term ? getWeekStartForDate(term.startDate) : fallback;
}

function toPatternDateTime(weekStart: string, dayOfWeek: number, time: string) {
  return `${addDays(weekStart, dayOfWeek - 1)}T${time}`;
}

function getMeetingStart(meeting: StudentRegistrationScheduleMeetingView, weekStart: string) {
  return toPatternDateTime(weekStart, meeting.dayOfWeek, meeting.startTime);
}

function getMeetingEnd(meeting: StudentRegistrationScheduleMeetingView, weekStart: string) {
  return toPatternDateTime(weekStart, meeting.dayOfWeek, meeting.endTime);
}

function getCourseStatusLabel(status: StudentRegistrationCourseStatus) {
  switch (status) {
    case 'PRE_REGISTERED':
      return 'Pre-registered';
    case 'WAITLISTED':
      return 'Waitlisted';
    case 'ENROLLED':
      return 'Enrolled';
  }
}

function mapMeetingsToEvents(
  meetings: StudentRegistrationScheduleMeetingView[],
  weekStart: string
): EventInput[] {
  return meetings.map((meeting) => ({
    backgroundColor: meeting.color,
    borderColor: meeting.color,
    end: getMeetingEnd(meeting, weekStart),
    extendedProps: { meeting },
    id: meeting.id,
    start: getMeetingStart(meeting, weekStart),
    title: `${meeting.courseCode}-${meeting.sectionCode}`,
  }));
}

function renderEventContent(eventInfo: EventContentArg) {
  const meeting = eventInfo.event.extendedProps.meeting as
    | StudentRegistrationScheduleMeetingView
    | undefined;
  const timeRange =
    formatTimeRange(eventInfo.event.start, eventInfo.event.end) || eventInfo.timeText;

  return (
    <div className={classes.eventContent}>
      <span className={classes.eventTitle}>{eventInfo.event.title}</span>
      <span className={classes.eventTime}>{timeRange}</span>
      {meeting ? (
        <span className={classes.eventStatus}>{getCourseStatusLabel(meeting.status)}</span>
      ) : null}
      {meeting?.location ? <span className={classes.eventMeta}>{meeting.location}</span> : null}
    </div>
  );
}

function renderDayHeader(headerInfo: { date: Date }) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(headerInfo.date);
}

export function StudentCourseRegistrationSchedule({
  schedule,
}: StudentCourseRegistrationScheduleProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const calendarShellRef = useRef<HTMLDivElement | null>(null);
  const selectedTerm =
    schedule.terms.find((term) => term.id === schedule.selectedTermId) ?? schedule.terms[0];
  const [selectedSubTermCodes, setSelectedSubTermCodes] = useState<string[]>(() =>
    selectedTerm ? getVisibleSubTerms(selectedTerm).map(getSubTermSelectionValue) : []
  );

  useEffect(() => {
    setSelectedSubTermCodes(
      selectedTerm ? getVisibleSubTerms(selectedTerm).map(getSubTermSelectionValue) : []
    );
  }, [selectedTerm]);

  const calendarWeekStart = getWeekStartForTerm(selectedTerm, schedule.weekStart);
  const overlappingSubTerms = selectedTerm ? getVisibleSubTerms(selectedTerm) : [];
  const overlappingSubTermCodes = new Set(overlappingSubTerms.map(getSubTermSelectionValue));
  const compatibleSubTermCodes = getCompatibleSubTermCodes(
    overlappingSubTerms,
    selectedSubTermCodes.filter((subTermCode) => overlappingSubTermCodes.has(subTermCode))
  );
  const effectiveSelectedSubTermCodes = filterCompatibleSubTermSelection(
    overlappingSubTerms,
    selectedSubTermCodes
  );
  const visibleSubTermCodes = new Set(effectiveSelectedSubTermCodes);
  const visibleMeetings = schedule.meetings.filter((meeting) => {
    if (selectedTerm && meeting.termId !== selectedTerm.id) {
      return false;
    }

    return visibleSubTermCodes.has(getMeetingSubTermSelectionValue(meeting));
  });
  const calendarEvents = useMemo(
    () => mapMeetingsToEvents(visibleMeetings, calendarWeekStart),
    [calendarWeekStart, visibleMeetings]
  );

  useEffect(() => {
    const calendarShell = calendarShellRef.current;
    const calendar = calendarRef.current;

    if (!calendarShell || !calendar) {
      return undefined;
    }

    const updateCalendarSize = () => {
      window.requestAnimationFrame(() => {
        calendar.getApi().updateSize();
      });
    };

    updateCalendarSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateCalendarSize);

      return () => window.removeEventListener('resize', updateCalendarSize);
    }

    const resizeObserver = new ResizeObserver(updateCalendarSize);
    resizeObserver.observe(calendarShell);

    return () => resizeObserver.disconnect();
  }, [calendarEvents, calendarWeekStart]);

  const subTermOptions = overlappingSubTerms.map((subTerm) => {
    const value = getSubTermSelectionValue(subTerm);
    const selected = effectiveSelectedSubTermCodes.includes(value);

    return {
      disabled: !selected && !compatibleSubTermCodes.has(value),
      label: `${subTerm.name} (${subTerm.code})`,
      value,
    };
  });
  const selectedSubTerms = overlappingSubTerms.filter((subTerm) =>
    effectiveSelectedSubTermCodes.includes(getSubTermSelectionValue(subTerm))
  );

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <MultiSelect
          clearable
          data={subTermOptions}
          label="Subterms"
          placeholder="Select subterms"
          value={effectiveSelectedSubTermCodes}
          onChange={(values) => {
            setSelectedSubTermCodes(filterCompatibleSubTermSelection(overlappingSubTerms, values));
          }}
        />
      </Grid.Col>
      {selectedSubTerms.length > 0 ? (
        <Grid.Col span={12}>
          <div className={classes.subTermDateSummary}>
            {selectedSubTerms.map((subTerm) => (
              <div key={subTerm.id} className={classes.subTermDateItem}>
                <Text fw={700}>{subTerm.name}</Text>
                <Text size="sm" c="dimmed">
                  {formatDateRange(subTerm.startDate, subTerm.endDate)}
                </Text>
              </div>
            ))}
          </div>
        </Grid.Col>
      ) : null}
      <Grid.Col span={12}>
        <Box ref={calendarShellRef} className={classes.calendarShell}>
          <Box className={classes.calendar}>
            <FullCalendar
              ref={calendarRef}
              allDaySlot={false}
              dayHeaderContent={renderDayHeader}
              editable={false}
              eventContent={renderEventContent}
              events={calendarEvents}
              headerToolbar={false}
              height="46rem"
              initialDate={calendarWeekStart}
              initialView="timeGridWeek"
              key={calendarWeekStart}
              nowIndicator={false}
              plugins={[timeGridPlugin]}
              scrollTime="08:00:00"
              scrollTimeReset={false}
              selectable={false}
              slotMaxTime="24:00:00"
              slotMinTime="00:00:00"
              weekends={false}
            />
          </Box>
        </Box>
      </Grid.Col>
    </Grid>
  );
}
