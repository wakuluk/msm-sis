package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CatalogCourseOffering;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogCourseOfferingRepository
        extends JpaRepository<CatalogCourseOffering, Long>, CatalogCourseOfferingRepositoryCustom {
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
}
