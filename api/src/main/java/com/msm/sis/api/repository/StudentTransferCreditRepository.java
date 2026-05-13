package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentTransferCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface StudentTransferCreditRepository extends JpaRepository<StudentTransferCredit, Long> {

    @Query(value = """
            select
                stc.student_transfer_credit_id as recordId,
                stc.external_term_label as termLabel,
                stc.transcript_sort_date as termSortDate,
                'TRANSFER' as source,
                coalesce(local_mapping.subject_code, stc.external_subject_code) as subjectCode,
                coalesce(local_mapping.course_number, stc.external_course_number) as courseNumber,
                coalesce(local_mapping.title, stc.external_course_title) as title,
                'TRANSFERRED' as statusCode,
                'Transferred' as statusName,
                null as repeatCode,
                null as repeatName,
                stc.transfer_grade_mark as gradeCode,
                'TRANSFER' as gradeTypeCode,
                stc.credits_attempted as attemptedCredits,
                stc.credits_earned as earnedCredits,
                false as includeInGpa,
                true as earnsCredit,
                false as countsInGpa,
                0 as qualityPointsPerCredit
            from student_transfer_credit stc
            left join lateral (
                select
                    string_agg(subject.code, ', ' order by subject.code, catalog_course.course_number) as subject_code,
                    string_agg(catalog_course.course_number, ', ' order by subject.code, catalog_course.course_number) as course_number,
                    string_agg(
                        coalesce(current_version.title, catalog_course.course_number),
                        '; '
                        order by subject.code, catalog_course.course_number
                    ) as title
                from student_transfer_credit_course stcc
                join course catalog_course
                  on catalog_course.course_id = stcc.course_id
                join academic_subject subject
                  on subject.subject_id = catalog_course.subject_id
                left join course_version current_version
                  on current_version.course_id = catalog_course.course_id
                 and current_version.is_current = true
                where stcc.student_transfer_credit_id = stc.student_transfer_credit_id
            ) local_mapping on true
            where stc.student_id = :studentId
            order by
                stc.transcript_sort_date,
                stc.external_term_label,
                stc.external_subject_code,
                stc.external_course_number
            """, nativeQuery = true)
    List<StudentTranscriptCourseProjection> findTranscriptTransferCourses(@Param("studentId") Long studentId);

    @Query(value = """
            select
                stc.student_transfer_credit_id as transferCreditId,
                stcc.course_id as courseId,
                department.department_id as departmentId,
                subject.code as subjectCode,
                catalog_course.course_number as courseNumber,
                coalesce(current_version.title, stc.external_course_title) as title,
                stc.credits_earned as creditsEarned,
                stc.transfer_grade_mark as gradeCode,
                stc.transcript_sort_date as completedDate
            from student_transfer_credit stc
            join student_transfer_credit_course stcc
              on stcc.student_transfer_credit_id = stc.student_transfer_credit_id
            join course catalog_course
              on catalog_course.course_id = stcc.course_id
            join academic_subject subject
              on subject.subject_id = catalog_course.subject_id
            join academic_department department
              on department.department_id = subject.department_id
            left join course_version current_version
              on current_version.course_id = catalog_course.course_id
             and current_version.is_current = true
            where stc.student_id = :studentId
              and stc.transfer_grade_mark = 'P'
              and stc.credits_earned > 0
            order by
                stc.transcript_sort_date,
                stc.external_term_label,
                subject.code,
                catalog_course.course_number
            """, nativeQuery = true)
    List<StudentCompletedTransferCourseProjection> findCompletedLocalTransferCourses(@Param("studentId") Long studentId);

    @Query("""
            select transferCredit.student.id as studentId,
                   coalesce(sum(transferCredit.creditsEarned), 0) as credits
            from StudentTransferCredit transferCredit
            where transferCredit.student.id in :studentIds
              and transferCredit.creditsEarned > 0
            group by transferCredit.student.id
            """)
    List<StudentTransferCreditTotalProjection> sumTransferCreditsByStudentIds(
            @Param("studentIds") List<Long> studentIds
    );

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

    interface StudentCompletedTransferCourseProjection {
        Long getTransferCreditId();

        Long getCourseId();

        Long getDepartmentId();

        String getSubjectCode();

        String getCourseNumber();

        String getTitle();

        BigDecimal getCreditsEarned();

        String getGradeCode();

        LocalDate getCompletedDate();
    }

    interface StudentTransferCreditTotalProjection {
        Long getStudentId();

        BigDecimal getCredits();
    }
}
