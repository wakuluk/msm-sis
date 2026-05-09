package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseSectionInstructor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface CourseSectionInstructorRepository extends JpaRepository<CourseSectionInstructor, Long> {

    @EntityGraph(attributePaths = {"courseSection", "instructorUser", "instructorStaff", "role"})
    @Query("""
            select instructor
            from CourseSectionInstructor instructor
            left join instructor.instructorStaff staff
            left join instructor.role role
            where instructor.courseSection.id = :sectionId
            order by role.sortOrder asc,
                     staff.lastName asc,
                     staff.firstName asc,
                     instructor.id asc
            """)
    List<CourseSectionInstructor> findAllByCourseSectionId(@Param("sectionId") Long sectionId);

    @Modifying
    @Query("""
            delete from CourseSectionInstructor instructor
            where instructor.courseSection.id = :sectionId
            """)
    void deleteAllByCourseSectionId(@Param("sectionId") Long sectionId);

    @EntityGraph(attributePaths = {
            "courseSection",
            "courseSection.status",
            "courseSection.subTerm",
            "courseSection.meetings",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "instructorUser",
            "instructorStaff",
            "role"
    })
    @Query("""
            select distinct instructor
            from CourseSectionInstructor instructor
            join instructor.courseSection section
            join section.subTerm subTerm
            left join section.status status
            where instructor.instructorUser.id in :instructorUserIds
              and (:excludedSectionId is null or section.id <> :excludedSectionId)
              and (status is null or upper(status.code) <> 'CANCELLED')
              and subTerm.startDate <= :proposedEndDate
              and subTerm.endDate >= :proposedStartDate
            """)
    List<CourseSectionInstructor> findPotentialScheduleConflicts(
            @Param("instructorUserIds") Collection<Long> instructorUserIds,
            @Param("excludedSectionId") Long excludedSectionId,
            @Param("proposedStartDate") LocalDate proposedStartDate,
            @Param("proposedEndDate") LocalDate proposedEndDate
    );
}
