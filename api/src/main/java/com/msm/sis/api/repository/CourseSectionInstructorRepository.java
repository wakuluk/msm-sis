package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseSectionInstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @EntityGraph(attributePaths = {"courseSection", "instructorUser", "instructorStaff", "role"})
    @Query("""
            select instructor
            from CourseSectionInstructor instructor
            left join instructor.instructorStaff staff
            left join instructor.role role
            where instructor.courseSection.id in :sectionIds
            order by instructor.courseSection.id asc,
                     role.sortOrder asc,
                     staff.lastName asc,
                     staff.firstName asc,
                     instructor.id asc
            """)
    List<CourseSectionInstructor> findAllByCourseSectionIdIn(
            @Param("sectionIds") Collection<Long> sectionIds
    );

    @Modifying
    @Query("""
            delete from CourseSectionInstructor instructor
            where instructor.courseSection.id = :sectionId
            """)
    void deleteAllByCourseSectionId(@Param("sectionId") Long sectionId);

    @Query("""
            select
                case when count(instructor) > 0 then true else false end
            from CourseSectionInstructor instructor
            where instructor.courseSection.id = :sectionId
              and instructor.instructorUser.id = :instructorUserId
            """)
    boolean existsAssignmentForInstructorUser(
            @Param("sectionId") Long sectionId,
            @Param("instructorUserId") Long instructorUserId
    );

    @Query("""
            select
                case when count(instructor) > 0 then true else false end
            from CourseSectionInstructor instructor
            where instructor.courseSection.id = :sectionId
              and instructor.instructorUser.id = :instructorUserId
              and (
                    instructor.canViewGrades = true
                    or instructor.canManageGrades = true
              )
            """)
    boolean existsGradeViewAssignmentForInstructorUser(
            @Param("sectionId") Long sectionId,
            @Param("instructorUserId") Long instructorUserId
    );

    @Query("""
            select
                case when count(instructor) > 0 then true else false end
            from CourseSectionInstructor instructor
            where instructor.courseSection.id = :sectionId
              and instructor.instructorUser.id = :instructorUserId
              and instructor.canManageGrades = true
            """)
    boolean existsGradeManageAssignmentForInstructorUser(
            @Param("sectionId") Long sectionId,
            @Param("instructorUserId") Long instructorUserId
    );

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

    @EntityGraph(attributePaths = {
            "courseSection",
            "courseSection.status",
            "courseSection.subTerm",
            "courseSection.subTerm.academicYear",
            "courseSection.courseOffering",
            "courseSection.courseOffering.academicYear",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "courseSection.courseOffering.courseVersion.course.subject.department",
            "courseSection.courseOffering.courseVersion.course.subject.department.school",
            "courseSection.deliveryMode",
            "instructorUser",
            "instructorStaff",
            "role"
    })
    @Query(
            value = """
                    select instructor
                    from CourseSectionInstructor instructor
                    join instructor.courseSection section
                    join section.status status
                    join section.subTerm subTerm
                    join subTerm.academicYear academicYear
                    join section.courseOffering offering
                    join offering.courseVersion courseVersion
                    join courseVersion.course course
                    join course.subject subject
                    join subject.department department
                    join department.school school
                    join instructor.instructorUser instructorUser
                    left join instructor.instructorStaff staff
                    join instructor.role role
                    join section.deliveryMode deliveryMode
                    where (:academicYearId is null or academicYear.id = :academicYearId)
                      and (:termId is null or exists (
                            select academicTerm.id
                            from AcademicTerm academicTerm
                            join academicTerm.academicSubTerms termSubTerm
                            where academicTerm.id = :termId
                              and termSubTerm.id = subTerm.id
                      ))
                      and (:subTermIdsEmpty = true or subTerm.id in :subTermIds)
                      and (:schoolId is null or school.id = :schoolId)
                      and (:departmentId is null or department.id = :departmentId)
                      and (:staffId is null or staff.id = :staffId)
                      and (:excludeDraft = false or upper(status.code) <> 'DRAFT')
                      and (:statusCode is null or status.code = :statusCode)
                      and (:roleCode is null or role.code = :roleCode)
                      and (:deliveryModeCode is null or deliveryMode.code = :deliveryModeCode)
                      and (
                            :instructorSearch is null
                            or lower(coalesce(staff.firstName, '')) like :instructorSearch
                            or lower(coalesce(staff.lastName, '')) like :instructorSearch
                            or lower(coalesce(staff.email, instructorUser.email)) like :instructorSearch
                            or lower(concat(concat(coalesce(staff.firstName, ''), ' '), coalesce(staff.lastName, ''))) like :instructorSearch
                      )
                      and (
                            :courseSearch is null
                            or lower(concat(subject.code, course.courseNumber)) like :courseSearch
                            or lower(coalesce(courseVersion.title, '')) like :courseSearch
                            or lower(coalesce(section.title, '')) like :courseSearch
                            or lower(section.sectionLetter) like :courseSearch
                      )
                    """,
            countQuery = """
                    select count(distinct instructor.id)
                    from CourseSectionInstructor instructor
                    join instructor.courseSection section
                    join section.status status
                    join section.subTerm subTerm
                    join subTerm.academicYear academicYear
                    join section.courseOffering offering
                    join offering.courseVersion courseVersion
                    join courseVersion.course course
                    join course.subject subject
                    join subject.department department
                    join department.school school
                    join instructor.instructorUser instructorUser
                    left join instructor.instructorStaff staff
                    join instructor.role role
                    join section.deliveryMode deliveryMode
                    where (:academicYearId is null or academicYear.id = :academicYearId)
                      and (:termId is null or exists (
                            select academicTerm.id
                            from AcademicTerm academicTerm
                            join academicTerm.academicSubTerms termSubTerm
                            where academicTerm.id = :termId
                              and termSubTerm.id = subTerm.id
                      ))
                      and (:subTermIdsEmpty = true or subTerm.id in :subTermIds)
                      and (:schoolId is null or school.id = :schoolId)
                      and (:departmentId is null or department.id = :departmentId)
                      and (:staffId is null or staff.id = :staffId)
                      and (:excludeDraft = false or upper(status.code) <> 'DRAFT')
                      and (:statusCode is null or status.code = :statusCode)
                      and (:roleCode is null or role.code = :roleCode)
                      and (:deliveryModeCode is null or deliveryMode.code = :deliveryModeCode)
                      and (
                            :instructorSearch is null
                            or lower(coalesce(staff.firstName, '')) like :instructorSearch
                            or lower(coalesce(staff.lastName, '')) like :instructorSearch
                            or lower(coalesce(staff.email, instructorUser.email)) like :instructorSearch
                            or lower(concat(concat(coalesce(staff.firstName, ''), ' '), coalesce(staff.lastName, ''))) like :instructorSearch
                      )
                      and (
                            :courseSearch is null
                            or lower(concat(subject.code, course.courseNumber)) like :courseSearch
                            or lower(coalesce(courseVersion.title, '')) like :courseSearch
                            or lower(coalesce(section.title, '')) like :courseSearch
                            or lower(section.sectionLetter) like :courseSearch
                      )
                    """
    )
    Page<CourseSectionInstructor> searchInstructorScheduleAssignments(
            @Param("academicYearId") Long academicYearId,
            @Param("termId") Long termId,
            @Param("subTermIds") Collection<Long> subTermIds,
            @Param("subTermIdsEmpty") boolean subTermIdsEmpty,
            @Param("schoolId") Long schoolId,
            @Param("departmentId") Long departmentId,
            @Param("staffId") Long staffId,
            @Param("excludeDraft") boolean excludeDraft,
            @Param("instructorSearch") String instructorSearch,
            @Param("courseSearch") String courseSearch,
            @Param("statusCode") String statusCode,
            @Param("roleCode") String roleCode,
            @Param("deliveryModeCode") String deliveryModeCode,
            Pageable pageable
    );
}
