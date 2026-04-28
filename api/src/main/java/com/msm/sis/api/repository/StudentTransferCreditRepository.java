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
                coalesce(stc.local_subject_code, stc.external_subject_code) as subjectCode,
                coalesce(stc.local_course_number, stc.external_course_number) as courseNumber,
                coalesce(stc.local_course_title, stc.external_course_title) as title,
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
            where stc.student_id = :studentId
            order by
                stc.transcript_sort_date,
                stc.external_term_label,
                stc.external_subject_code,
                stc.external_course_number
            """, nativeQuery = true)
    List<StudentTranscriptCourseProjection> findTranscriptTransferCourses(@Param("studentId") Long studentId);

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
