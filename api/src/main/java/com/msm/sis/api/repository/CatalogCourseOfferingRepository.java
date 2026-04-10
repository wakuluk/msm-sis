package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogCourseOffering;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CatalogCourseOfferingRepository extends JpaRepository<CatalogCourseOffering, Long> {
    @Override
    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "term",
            "term.academicYear",
            "term.status",
            "status"
    })
    Optional<CatalogCourseOffering> findById(Long id);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "term",
            "term.academicYear",
            "term.status",
            "status"
    })
    List<CatalogCourseOffering> findAllByTerm_Code(String termCode);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "term",
            "term.academicYear",
            "term.status",
            "status"
    })
    List<CatalogCourseOffering> findAllByCourseVersion_Course_Id(Long courseId);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "term",
            "term.academicYear",
            "term.status",
            "status"
    })
    Optional<CatalogCourseOffering> findByCourseVersion_IdAndTerm_Id(Long courseVersionId, Long termId);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "term",
            "term.academicYear",
            "term.status",
            "status"
    })
    @Query(
            value = """
                    select offering
                    from CatalogCourseOffering offering
                    join offering.courseVersion courseVersion
                    join courseVersion.course course
                    join course.subject subject
                    join subject.department department
                    join offering.term term
                    join term.academicYear academicYear
                    join term.status termStatus
                    join offering.status status
                    where (:academicYearCode is null or lower(academicYear.code) = lower(:academicYearCode))
                      and (:termCode is null or lower(term.code) = lower(:termCode))
                      and (:departmentCode is null or lower(department.code) = lower(:departmentCode))
                      and (:subjectCode is null or lower(subject.code) = lower(:subjectCode))
                      and (:courseNumber is null or lower(course.courseNumber) like lower(concat('%', :courseNumber, '%')))
                      and (
                          :courseCode is null
                          or lower(concat(subject.code, ' ', course.courseNumber)) like lower(concat('%', :courseCode, '%'))
                          or lower(concat(subject.code, course.courseNumber)) like lower(concat('%', :courseCode, '%'))
                      )
                      and (:title is null or lower(courseVersion.title) like lower(concat('%', :title, '%')))
                      and (:description is null or lower(courseVersion.catalogDescription) like lower(concat('%', :description, '%')))
                      and (:minCredits is null or courseVersion.minCredits >= :minCredits)
                      and (:maxCredits is null or courseVersion.maxCredits <= :maxCredits)
                      and (:variableCredit is null or courseVersion.variableCredit = :variableCredit)
                      and (:offeringStatusCode is null or lower(status.code) = lower(:offeringStatusCode))
                      and (:termStatusCode is null or lower(termStatus.code) = lower(:termStatusCode))
                      and (
                          :includeInactive = true
                          or (
                              department.active = true
                              and subject.active = true
                              and course.active = true
                              and courseVersion.active = true
                              and academicYear.active = true
                              and term.active = true
                              and termStatus.active = true
                              and status.active = true
                          )
                      )
                    """,
            countQuery = """
                    select count(offering)
                    from CatalogCourseOffering offering
                    join offering.courseVersion courseVersion
                    join courseVersion.course course
                    join course.subject subject
                    join subject.department department
                    join offering.term term
                    join term.academicYear academicYear
                    join term.status termStatus
                    join offering.status status
                    where (:academicYearCode is null or lower(academicYear.code) = lower(:academicYearCode))
                      and (:termCode is null or lower(term.code) = lower(:termCode))
                      and (:departmentCode is null or lower(department.code) = lower(:departmentCode))
                      and (:subjectCode is null or lower(subject.code) = lower(:subjectCode))
                      and (:courseNumber is null or lower(course.courseNumber) like lower(concat('%', :courseNumber, '%')))
                      and (
                          :courseCode is null
                          or lower(concat(subject.code, ' ', course.courseNumber)) like lower(concat('%', :courseCode, '%'))
                          or lower(concat(subject.code, course.courseNumber)) like lower(concat('%', :courseCode, '%'))
                      )
                      and (:title is null or lower(courseVersion.title) like lower(concat('%', :title, '%')))
                      and (:description is null or lower(courseVersion.catalogDescription) like lower(concat('%', :description, '%')))
                      and (:minCredits is null or courseVersion.minCredits >= :minCredits)
                      and (:maxCredits is null or courseVersion.maxCredits <= :maxCredits)
                      and (:variableCredit is null or courseVersion.variableCredit = :variableCredit)
                      and (:offeringStatusCode is null or lower(status.code) = lower(:offeringStatusCode))
                      and (:termStatusCode is null or lower(termStatus.code) = lower(:termStatusCode))
                      and (
                          :includeInactive = true
                          or (
                              department.active = true
                              and subject.active = true
                              and course.active = true
                              and courseVersion.active = true
                              and academicYear.active = true
                              and term.active = true
                              and termStatus.active = true
                              and status.active = true
                          )
                      )
                    """
    )
    Page<CatalogCourseOffering> searchCourseOfferings(
            @Param("academicYearCode") String academicYearCode,
            @Param("termCode") String termCode,
            @Param("departmentCode") String departmentCode,
            @Param("subjectCode") String subjectCode,
            @Param("courseNumber") String courseNumber,
            @Param("courseCode") String courseCode,
            @Param("title") String title,
            @Param("description") String description,
            @Param("minCredits") BigDecimal minCredits,
            @Param("maxCredits") BigDecimal maxCredits,
            @Param("variableCredit") Boolean variableCredit,
            @Param("offeringStatusCode") String offeringStatusCode,
            @Param("termStatusCode") String termStatusCode,
            @Param("includeInactive") boolean includeInactive,
            Pageable pageable
    );
}
