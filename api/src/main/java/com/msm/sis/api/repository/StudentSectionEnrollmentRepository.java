package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudentSectionEnrollmentRepository extends JpaRepository<StudentSectionEnrollment, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "courseSection",
            "status",
            "gradingBasis",
            "statusChangedByUser",
            "grades",
            "grades.gradeType",
            "grades.gradeMark",
            "grades.postedByUser"
    })
    Optional<StudentSectionEnrollment> findById(Long id);

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "status",
            "gradingBasis",
            "statusChangedByUser"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
            """)
    Page<StudentSectionEnrollment> findPageBySectionId(
            @Param("sectionId") Long sectionId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "courseSection",
            "status",
            "gradingBasis",
            "statusChangedByUser",
            "grades",
            "grades.gradeType",
            "grades.gradeMark",
            "grades.postedByUser"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and enrollment.id = :enrollmentId
            """)
    Optional<StudentSectionEnrollment> findBySectionIdAndEnrollmentId(
            @Param("sectionId") Long sectionId,
            @Param("enrollmentId") Long enrollmentId
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "courseSection",
            "status",
            "gradingBasis",
            "statusChangedByUser"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and enrollment.student.id = :studentId
            """)
    Optional<StudentSectionEnrollment> findBySectionIdAndStudentId(
            @Param("sectionId") Long sectionId,
            @Param("studentId") Long studentId
    );

    @Query("""
            select
                case when count(enrollment) > 0 then true else false end
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and enrollment.student.id = :studentId
            """)
    boolean existsBySectionIdAndStudentId(
            @Param("sectionId") Long sectionId,
            @Param("studentId") Long studentId
    );

    @Query("""
            select count(enrollment)
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and upper(enrollment.status.code) = upper(:statusCode)
            """)
    long countBySectionIdAndStatusCode(
            @Param("sectionId") Long sectionId,
            @Param("statusCode") String statusCode
    );

    @Query("""
            select coalesce(max(enrollment.waitlistPosition), 0)
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
            """)
    Integer findMaxWaitlistPositionBySectionId(
            @Param("sectionId") Long sectionId
    );

    @Query(value = """
            select
                sse.student_section_enrollment_id as recordId,
                term.name as termLabel,
                term.start_date as termSortDate,
                'LOCAL' as source,
                subject.code as subjectCode,
                catalog_course.course_number as courseNumber,
                coalesce(section.title, course_version.title) as title,
                enrollment_status.code as statusCode,
                enrollment_status.name as statusName,
                sse.repeat_code as repeatCode,
                null as repeatName,
                coalesce(final_mark.code, midterm_mark.code) as gradeCode,
                case
                    when final_mark.grade_mark_id is not null then 'FINAL'
                    when midterm_mark.grade_mark_id is not null then 'MIDTERM'
                    else null
                end as gradeTypeCode,
                coalesce(sse.credits_attempted, section.credits) as attemptedCredits,
                sse.credits_earned as earnedCredits,
                sse.include_in_gpa as includeInGpa,
                coalesce(final_mark.earns_credit, midterm_mark.earns_credit, false) as earnsCredit,
                coalesce(final_mark.counts_in_gpa, midterm_mark.counts_in_gpa, false) as countsInGpa,
                coalesce(final_mark.quality_points, midterm_mark.quality_points, 0) as qualityPointsPerCredit
            from student_section_enrollment sse
            join student_section_enrollment_status enrollment_status
              on enrollment_status.student_section_enrollment_status_id = sse.student_section_enrollment_status_id
            join course_section section
              on section.section_id = sse.section_id
            join course_offering offering
              on offering.course_offering_id = section.course_offering_id
            join course_version course_version
              on course_version.course_version_id = offering.course_version_id
            join course catalog_course
              on catalog_course.course_id = course_version.course_id
            join academic_subject subject
              on subject.subject_id = catalog_course.subject_id
            join academic_term_sub_term term_sub_term
              on term_sub_term.sub_term_id = section.sub_term_id
            join academic_term term
              on term.term_id = term_sub_term.term_id
            left join student_section_grade final_grade
              on final_grade.student_section_enrollment_id = sse.student_section_enrollment_id
             and final_grade.is_current = true
             and final_grade.student_section_grade_type_id = (
                select final_type.student_section_grade_type_id
                from student_section_grade_type final_type
                where upper(final_type.code) = 'FINAL'
             )
            left join grade_mark final_mark
              on final_mark.grade_mark_id = final_grade.grade_mark_id
            left join student_section_grade midterm_grade
              on midterm_grade.student_section_enrollment_id = sse.student_section_enrollment_id
             and midterm_grade.is_current = true
             and final_grade.student_section_grade_id is null
             and midterm_grade.student_section_grade_type_id = (
                select midterm_type.student_section_grade_type_id
                from student_section_grade_type midterm_type
                where upper(midterm_type.code) = 'MIDTERM'
             )
            left join grade_mark midterm_mark
              on midterm_mark.grade_mark_id = midterm_grade.grade_mark_id
            where sse.student_id = :studentId
            order by
                term.start_date,
                subject.code,
                catalog_course.course_number,
                sse.student_section_enrollment_id
            """, nativeQuery = true)
    List<StudentTranscriptCourseProjection> findTranscriptLocalCourses(@Param("studentId") Long studentId);

    interface StudentTranscriptCourseProjection {
        Long getRecordId();

        String getTermLabel();

        LocalDate getTermSortDate();

        String getSource();

        String getSubjectCode();

        String getCourseNumber();

        String getTitle();

        String getStatusCode();

        String getStatusName();

        String getRepeatCode();

        String getRepeatName();

        String getGradeCode();

        String getGradeTypeCode();

        BigDecimal getAttemptedCredits();

        BigDecimal getEarnedCredits();

        Boolean getIncludeInGpa();

        Boolean getEarnsCredit();

        Boolean getCountsInGpa();

        BigDecimal getQualityPointsPerCredit();
    }
}
