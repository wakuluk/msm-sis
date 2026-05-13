package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentCourseRegistrationSelection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentCourseRegistrationSelectionRepository
        extends JpaRepository<StudentCourseRegistrationSelection, Long> {

    @EntityGraph(attributePaths = {
            "student",
            "courseSection",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "courseSection.status",
            "courseSection.deliveryMode",
            "courseSection.gradingBasis",
            "courseSection.subTerm",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term",
            "selectedGradingBasis"
    })
    @Query("""
            select selection
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.registrationGroup.id = :registrationGroupId
            order by selection.courseSection.courseOffering.courseVersion.course.subject.code asc,
                     selection.courseSection.courseOffering.courseVersion.course.courseNumber asc,
                     selection.courseSection.sectionLetter asc,
                     selection.id asc
            """)
    List<StudentCourseRegistrationSelection> findSelectionsForStudentAndGroup(
            @Param("studentId") Long studentId,
            @Param("registrationGroupId") Long registrationGroupId
    );

    @EntityGraph(attributePaths = {
            "courseSection",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "courseSection.subTerm"
    })
    @Query("""
            select selection
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.registrationGroup.id = :registrationGroupId
              and (:excludedSectionId is null or selection.courseSection.id <> :excludedSectionId)
            order by selection.courseSection.courseOffering.courseVersion.course.subject.code asc,
                     selection.courseSection.courseOffering.courseVersion.course.courseNumber asc,
                     selection.courseSection.sectionLetter asc,
                     selection.id asc
            """)
    List<StudentCourseRegistrationSelection> findScheduleConflictSelectionsForStudentAndGroup(
            @Param("studentId") Long studentId,
            @Param("registrationGroupId") Long registrationGroupId,
            @Param("excludedSectionId") Long excludedSectionId
    );

    @EntityGraph(attributePaths = {
            "student",
            "courseSection",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term",
            "selectedGradingBasis"
    })
    @Query("""
            select selection
            from StudentCourseRegistrationSelection selection
            where selection.id = :selectionId
              and selection.student.id = :studentId
            """)
    Optional<StudentCourseRegistrationSelection> findSelectionForStudent(
            @Param("selectionId") Long selectionId,
            @Param("studentId") Long studentId
    );

    @Query("""
            select selection
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.courseSection.id = :sectionId
            """)
    Optional<StudentCourseRegistrationSelection> findByStudentIdAndSectionId(
            @Param("studentId") Long studentId,
            @Param("sectionId") Long sectionId
    );

    @Query("""
            select
                case when count(selection) > 0 then true else false end
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.courseSection.id = :sectionId
            """)
    boolean existsByStudentIdAndSectionId(
            @Param("studentId") Long studentId,
            @Param("sectionId") Long sectionId
    );

    @Query("""
            select
                case when count(selection) > 0 then true else false end
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.registrationGroup.id = :registrationGroupId
              and selection.courseSection.id = :sectionId
            """)
    boolean existsByStudentIdAndRegistrationGroupIdAndSectionId(
            @Param("studentId") Long studentId,
            @Param("registrationGroupId") Long registrationGroupId,
            @Param("sectionId") Long sectionId
    );

    @EntityGraph(attributePaths = {
            "courseSection",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "courseSection.subTerm",
            "registrationGroup",
            "registrationGroup.term"
    })
    @Query("""
            select selection
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.registrationGroup.id = :registrationGroupId
              and selection.courseSection.courseOffering.courseVersion.course.id = :courseId
              and (:excludedSectionId is null or selection.courseSection.id <> :excludedSectionId)
            order by selection.courseSection.sectionLetter asc,
                     selection.id asc
            """)
    List<StudentCourseRegistrationSelection> findSameCourseSelectionsForStudentAndGroup(
            @Param("studentId") Long studentId,
            @Param("registrationGroupId") Long registrationGroupId,
            @Param("courseId") Long courseId,
            @Param("excludedSectionId") Long excludedSectionId
    );

    @EntityGraph(attributePaths = {
            "courseSection",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.subTerm"
    })
    @Query("""
            select selection
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.registrationGroup.term.id = :termId
            """)
    List<StudentCourseRegistrationSelection> findSelectionsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId
    );

    @EntityGraph(attributePaths = {
            "courseSection",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "courseSection.subTerm",
            "registrationGroup",
            "registrationGroup.term"
    })
    @Query("""
            select selection
            from StudentCourseRegistrationSelection selection
            where selection.student.id = :studentId
              and selection.registrationGroup.term.id = :termId
              and selection.courseSection.courseOffering.courseVersion.course.id = :courseId
              and (:excludedSectionId is null or selection.courseSection.id <> :excludedSectionId)
            order by selection.registrationGroup.id asc,
                     selection.courseSection.sectionLetter asc,
                     selection.id asc
            """)
    List<StudentCourseRegistrationSelection> findSameCourseSelectionsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId,
            @Param("courseId") Long courseId,
            @Param("excludedSectionId") Long excludedSectionId
    );
}
