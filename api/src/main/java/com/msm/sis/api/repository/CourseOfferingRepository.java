package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseOffering;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseOfferingRepository
        extends JpaRepository<CourseOffering, Long>, CourseOfferingRepositoryCustom {
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
    Optional<CourseOffering> findById(Long id);

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
    List<CourseOffering> findAllByTerm_Code(String termCode);

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
    List<CourseOffering> findAllByTerm_Id(Long termId, Sort sort);

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
    List<CourseOffering> findAllByCourseVersion_Course_Id(Long courseId, Sort sort);

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
    Optional<CourseOffering> findByCourseVersion_IdAndTerm_Id(Long courseVersionId, Long termId);
}
