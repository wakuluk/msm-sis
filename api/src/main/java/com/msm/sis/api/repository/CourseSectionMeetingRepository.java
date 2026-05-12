package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseSectionMeeting;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CourseSectionMeetingRepository extends JpaRepository<CourseSectionMeeting, Long> {

    @EntityGraph(attributePaths = {"courseSection", "meetingType"})
    List<CourseSectionMeeting> findAllByCourseSection_IdOrderBySequenceNumberAsc(Long sectionId);

    @EntityGraph(attributePaths = {"courseSection", "meetingType"})
    @Query("""
            select meeting
            from CourseSectionMeeting meeting
            left join meeting.meetingType meetingType
            where meeting.courseSection.id in :sectionIds
            order by meeting.courseSection.id asc,
                     meeting.sequenceNumber asc,
                     meeting.dayOfWeek asc,
                     meeting.startTime asc,
                     meeting.id asc
            """)
    List<CourseSectionMeeting> findAllByCourseSectionIdIn(
            @Param("sectionIds") Collection<Long> sectionIds
    );

    @EntityGraph(attributePaths = {"courseSection", "meetingType"})
    @Query("""
            select meeting
            from CourseSectionMeeting meeting
            left join meeting.meetingType meetingType
            where meeting.courseSection.id in :sectionIds
            order by meeting.courseSection.id asc,
                     meeting.sequenceNumber asc,
                     meeting.dayOfWeek asc,
                     meeting.startTime asc,
                     meeting.id asc
            """)
    List<CourseSectionMeeting> findScheduleConflictMeetingsBySectionIds(
            @Param("sectionIds") Collection<Long> sectionIds
    );

    @Modifying
    @Query("""
            delete from CourseSectionMeeting meeting
            where meeting.courseSection.id = :sectionId
            """)
    void deleteAllByCourseSectionId(@Param("sectionId") Long sectionId);
}
