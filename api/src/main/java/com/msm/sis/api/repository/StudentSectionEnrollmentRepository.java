package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicTerm;
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

    @EntityGraph(attributePaths = {
            "student",
            "courseSection",
            "courseSection.subTerm",
            "courseSection.courseOffering",
            "courseSection.courseOffering.academicYear",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "status"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.id = :enrollmentId
              and enrollment.student.id = :studentId
            """)
    Optional<StudentSectionEnrollment> findRegistrationEnrollmentForStudent(
            @Param("enrollmentId") Long enrollmentId,
            @Param("studentId") Long studentId
    );

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
            "status",
            "gradingBasis"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            join enrollment.courseSection section
            join section.subTerm subTerm
            where enrollment.student.id = :studentId
              and upper(enrollment.status.code) in ('REGISTERED', 'WAITLISTED', 'WAITLIST_EXPIRED', 'IN_PROGRESS')
              and exists (
                    select academicTerm.id
                    from AcademicTerm academicTerm
                    join academicTerm.academicSubTerms termSubTerm
                    where academicTerm.id = :termId
                      and termSubTerm.id = subTerm.id
              )
            order by section.courseOffering.courseVersion.course.subject.code asc,
                     section.courseOffering.courseVersion.course.courseNumber asc,
                     section.sectionLetter asc,
                     enrollment.id asc
            """)
    List<StudentSectionEnrollment> findCourseRegistrationEnrollmentsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId
    );

    @Query("""
            select distinct enrollment as enrollment,
                            academicTerm as term
            from StudentSectionEnrollment enrollment
            join fetch enrollment.courseSection section
            join fetch section.courseOffering offering
            join fetch offering.courseVersion courseVersion
            join fetch courseVersion.course course
            join fetch course.subject subject
            join fetch section.subTerm subTerm
            join fetch subTerm.academicYear subTermAcademicYear
            join fetch enrollment.status enrollmentStatus
            join fetch enrollment.gradingBasis gradingBasis
            left join fetch section.status sectionStatus
            left join fetch section.deliveryMode deliveryMode
            left join fetch section.gradingBasis sectionGradingBasis
            cross join AcademicTerm academicTerm
            join academicTerm.academicSubTerms termSubTerm
            join fetch academicTerm.academicYear academicYear
            where enrollment.student.id = :studentId
              and termSubTerm.id = subTerm.id
              and (:termId is null or academicTerm.id = :termId)
            order by academicTerm.startDate desc,
                     academicTerm.id desc,
                     subject.code asc,
                     course.courseNumber asc,
                     section.sectionLetter asc,
                     enrollment.id asc
            """)
    List<StudentScheduleEnrollmentProjection> findStudentScheduleEnrollments(
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
            "status"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            join enrollment.courseSection section
            join section.subTerm subTerm
            where enrollment.student.id = :studentId
              and (:excludedSectionId is null or section.id <> :excludedSectionId)
              and upper(enrollment.status.code) in ('REGISTERED', 'IN_PROGRESS')
              and exists (
                    select academicTerm.id
                    from AcademicTerm academicTerm
                    join academicTerm.academicSubTerms termSubTerm
                    where academicTerm.id = :termId
                      and termSubTerm.id = subTerm.id
              )
            order by section.courseOffering.courseVersion.course.subject.code asc,
                     section.courseOffering.courseVersion.course.courseNumber asc,
                     section.sectionLetter asc,
                     enrollment.id asc
            """)
    List<StudentSectionEnrollment> findScheduleConflictEnrollmentsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId,
            @Param("excludedSectionId") Long excludedSectionId
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
            select
                case when count(enrollment) > 0 then true else false end
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and enrollment.student.id = :studentId
              and upper(enrollment.status.code) in ('REGISTERED', 'WAITLISTED', 'IN_PROGRESS')
            """)
    boolean existsActiveBySectionIdAndStudentId(
            @Param("sectionId") Long sectionId,
            @Param("studentId") Long studentId
    );

    @EntityGraph(attributePaths = {
            "courseSection",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "courseSection.subTerm",
            "status"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            join enrollment.courseSection section
            join section.subTerm subTerm
            where enrollment.student.id = :studentId
              and section.courseOffering.courseVersion.course.id = :courseId
              and (:excludedSectionId is null or section.id <> :excludedSectionId)
              and upper(enrollment.status.code) in ('REGISTERED', 'WAITLISTED', 'IN_PROGRESS')
              and exists (
                    select academicTerm.id
                    from AcademicTerm academicTerm
                    join academicTerm.academicSubTerms termSubTerm
                    where academicTerm.id = :termId
                      and termSubTerm.id = subTerm.id
              )
            order by section.sectionLetter asc,
                     enrollment.id asc
            """)
    List<StudentSectionEnrollment> findActiveSameCourseEnrollmentsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId,
            @Param("courseId") Long courseId,
            @Param("excludedSectionId") Long excludedSectionId
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
            select count(enrollment)
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and upper(enrollment.status.code) in :statusCodes
            """)
    long countBySectionIdAndStatusCodes(
            @Param("sectionId") Long sectionId,
            @Param("statusCodes") List<String> statusCodes
    );

    @Query("""
            select coalesce(max(enrollment.waitlistPosition), 0)
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
            """)
    Integer findMaxWaitlistPositionBySectionId(
            @Param("sectionId") Long sectionId
    );

    @EntityGraph(attributePaths = {
            "student",
            "courseSection",
            "courseSection.courseOffering",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "status"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and upper(enrollment.status.code) = 'WAITLISTED'
              and enrollment.waitlistPosition is not null
            order by enrollment.waitlistPosition asc,
                     enrollment.waitlistedAt asc,
                     enrollment.id asc
            """)
    List<StudentSectionEnrollment> findWaitlistedQueueBySectionId(
            @Param("sectionId") Long sectionId
    );

    default Optional<StudentSectionEnrollment> findNextWaitlistedBySectionId(Long sectionId) {
        return findWaitlistedQueueBySectionId(sectionId).stream().findFirst();
    }

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

    @Query(value = """
            select
                sse.student_section_enrollment_id as enrollmentId,
                catalog_course.course_id as courseId,
                department.department_id as departmentId,
                subject.code as subjectCode,
                catalog_course.course_number as courseNumber,
                concat(subject.code, ' ', catalog_course.course_number) as courseCode,
                coalesce(section.title, course_version.title) as title,
                sse.credits_earned as creditsEarned,
                final_mark.code as gradeCode,
                academic_year.academic_year_id as academicYearId,
                academic_year.code as academicYearCode,
                academic_year.name as academicYearName,
                academic_year.start_date as academicYearStartDate,
                academic_year.end_date as academicYearEndDate,
                term.term_id as termId,
                term.code as termCode,
                term.name as termName,
                term.start_date as termStartDate,
                term.end_date as termEndDate,
                term.start_date as termSortDate,
                coalesce(term.end_date, sse.enrollment_date) as completedDate
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
            join academic_department department
              on department.department_id = subject.department_id
            join academic_term_sub_term term_sub_term
              on term_sub_term.sub_term_id = section.sub_term_id
            join academic_term term
              on term.term_id = term_sub_term.term_id
            join academic_year academic_year
              on academic_year.academic_year_id = term.academic_year_id
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
            where sse.student_id = :studentId
              and upper(enrollment_status.code) = 'COMPLETED'
              and sse.credits_earned is not null
            order by
                academic_year.start_date,
                term.start_date,
                subject.code,
                catalog_course.course_number,
                sse.student_section_enrollment_id
            """, nativeQuery = true)
    List<StudentCompletedLocalCourseProjection> findCompletedLocalCourses(@Param("studentId") Long studentId);

    @Query(value = """
            select
                sse.student_section_enrollment_id as enrollmentId,
                catalog_course.course_id as courseId,
                department.department_id as departmentId,
                subject.code as subjectCode,
                catalog_course.course_number as courseNumber,
                concat(subject.code, ' ', catalog_course.course_number) as courseCode,
                coalesce(section.title, course_version.title) as title,
                coalesce(sse.credits_attempted, section.credits) as creditsAttempted,
                enrollment_status.code as statusCode,
                academic_year.academic_year_id as academicYearId,
                academic_year.code as academicYearCode,
                academic_year.name as academicYearName,
                academic_year.start_date as academicYearStartDate,
                academic_year.end_date as academicYearEndDate,
                term.term_id as termId,
                term.code as termCode,
                term.name as termName,
                term.start_date as termStartDate,
                term.end_date as termEndDate,
                term.start_date as termSortDate
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
            join academic_department department
              on department.department_id = subject.department_id
            join academic_term_sub_term term_sub_term
              on term_sub_term.sub_term_id = section.sub_term_id
            join academic_term term
              on term.term_id = term_sub_term.term_id
            join academic_year academic_year
              on academic_year.academic_year_id = term.academic_year_id
            where sse.student_id = :studentId
              and upper(enrollment_status.code) in ('REGISTERED', 'IN_PROGRESS')
            order by
                academic_year.start_date,
                term.start_date,
                subject.code,
                catalog_course.course_number,
                sse.student_section_enrollment_id
            """, nativeQuery = true)
    List<StudentCurrentRegisteredCourseProjection> findCurrentRegisteredOrInProgressCourses(
            @Param("studentId") Long studentId
    );

    @Query("""
            select enrollment.courseSection.id as sectionId,
                   upper(enrollment.status.code) as statusCode,
                   count(enrollment.id) as enrollmentCount
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id in :sectionIds
              and upper(enrollment.status.code) in ('REGISTERED', 'WAITLISTED', 'IN_PROGRESS')
            group by enrollment.courseSection.id,
                     upper(enrollment.status.code)
            """)
    List<CourseSectionEnrollmentCountProjection> countActiveEnrollmentsBySectionIds(
            @Param("sectionIds") List<Long> sectionIds
    );

    @Query("""
            select distinct enrollment.courseSection.id
            from StudentSectionEnrollment enrollment
            join enrollment.courseSection section
            join section.subTerm subTerm
            where enrollment.student.id = :studentId
              and upper(enrollment.status.code) in ('REGISTERED', 'WAITLISTED', 'IN_PROGRESS')
              and exists (
                    select academicTerm.id
                    from AcademicTerm academicTerm
                    join academicTerm.academicSubTerms termSubTerm
                    where academicTerm.id = :termId
                      and termSubTerm.id = subTerm.id
              )
            """)
    List<Long> findActiveSectionIdsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId
    );

    @Query("""
            select distinct enrollment.courseSection.id
            from StudentSectionEnrollment enrollment
            join enrollment.courseSection section
            join section.subTerm subTerm
            where enrollment.student.id = :studentId
              and exists (
                    select academicTerm.id
                    from AcademicTerm academicTerm
                    join academicTerm.academicSubTerms termSubTerm
                    where academicTerm.id = :termId
                      and termSubTerm.id = subTerm.id
              )
            """)
    List<Long> findSectionIdsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId
    );

    @Query("""
            select enrollment.student.id as studentId,
                   coalesce(sum(coalesce(enrollment.creditsEarned, enrollment.creditsAttempted, enrollment.courseSection.credits)), 0) as credits
            from StudentSectionEnrollment enrollment
            where enrollment.student.id in :studentIds
              and upper(enrollment.status.code) = 'COMPLETED'
            group by enrollment.student.id
            """)
    List<StudentCreditTotalProjection> sumCompletedCreditsByStudentIds(
            @Param("studentIds") List<Long> studentIds
    );

    @Query("""
            select enrollment.student.id as studentId,
                   coalesce(sum(coalesce(enrollment.creditsAttempted, enrollment.courseSection.credits)), 0) as credits
            from StudentSectionEnrollment enrollment
            where enrollment.student.id in :studentIds
              and upper(enrollment.status.code) = 'REGISTERED'
            group by enrollment.student.id
            """)
    List<StudentCreditTotalProjection> sumCurrentCreditsByStudentIds(
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

    interface StudentScheduleEnrollmentProjection {
        StudentSectionEnrollment getEnrollment();

        AcademicTerm getTerm();
    }

    interface StudentCompletedLocalCourseProjection {
        Long getEnrollmentId();

        Long getCourseId();

        Long getDepartmentId();

        String getSubjectCode();

        String getCourseNumber();

        String getCourseCode();

        String getTitle();

        BigDecimal getCreditsEarned();

        String getGradeCode();

        Long getAcademicYearId();

        String getAcademicYearCode();

        String getAcademicYearName();

        LocalDate getAcademicYearStartDate();

        LocalDate getAcademicYearEndDate();

        Long getTermId();

        String getTermCode();

        String getTermName();

        LocalDate getTermStartDate();

        LocalDate getTermEndDate();

        LocalDate getTermSortDate();

        LocalDate getCompletedDate();
    }

    interface StudentCurrentRegisteredCourseProjection {
        Long getEnrollmentId();

        Long getCourseId();

        Long getDepartmentId();

        String getSubjectCode();

        String getCourseNumber();

        String getCourseCode();

        String getTitle();

        BigDecimal getCreditsAttempted();

        String getStatusCode();

        Long getAcademicYearId();

        String getAcademicYearCode();

        String getAcademicYearName();

        LocalDate getAcademicYearStartDate();

        LocalDate getAcademicYearEndDate();

        Long getTermId();

        String getTermCode();

        String getTermName();

        LocalDate getTermStartDate();

        LocalDate getTermEndDate();

        LocalDate getTermSortDate();
    }

    interface CourseSectionEnrollmentCountProjection {
        Long getSectionId();

        String getStatusCode();

        long getEnrollmentCount();
    }

    interface StudentCreditTotalProjection {
        Long getStudentId();

        BigDecimal getCredits();
    }
}
