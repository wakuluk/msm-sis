package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseOffering;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseOfferingRepository
        extends JpaRepository<CourseOffering, Long>, CourseOfferingRepositoryCustom {
    interface TermCourseOfferingCount {
        Long getTermId();
        long getCourseOfferingCount();
    }

    @Override
    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "courseVersion.course.subject.department.school",
            "academicYear",
            "courseOfferingTerms",
            "courseOfferingTerms.term",
            "courseOfferingTerms.term.status",
            "status"
    })
    Optional<CourseOffering> findById(Long id);

    @Query("""
            select distinct courseOffering
            from CourseOffering courseOffering
            join courseOffering.courseOfferingTerms courseOfferingTerm
            where courseOfferingTerm.term.id = :termId
            """)
    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "courseVersion.course.subject.department.school",
            "academicYear",
            "courseOfferingTerms",
            "courseOfferingTerms.term",
            "courseOfferingTerms.term.status",
            "status"
    })
    List<CourseOffering> findAllByAcademicTermId(@Param("termId") Long termId, Sort sort);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "courseVersion.course.subject.department.school",
            "academicYear",
            "courseOfferingTerms",
            "courseOfferingTerms.term",
            "courseOfferingTerms.term.status",
            "status"
    })
    List<CourseOffering> findAllByCourseVersion_Course_Id(Long courseId, Sort sort);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "courseVersion.course.subject.department.school",
            "academicYear",
            "courseOfferingTerms",
            "courseOfferingTerms.term",
            "courseOfferingTerms.term.status",
            "status"
    })
    List<CourseOffering> findAllByAcademicYear_Id(Long academicYearId, Sort sort);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "academicYear",
            "courseOfferingTerms",
            "courseOfferingTerms.term",
            "courseOfferingTerms.term.status",
            "status"
    })
    Optional<CourseOffering> findByCourseVersion_IdAndAcademicYear_Id(Long courseVersionId, Long academicYearId);

    @Query("""
            select
                case when count(courseOffering) > 0 then true else false end
            from CourseOffering courseOffering
            where courseOffering.courseVersion.course.id = :courseId
              and courseOffering.academicYear.id = :academicYearId
            """)
    boolean existsByCourseIdAndAcademicYearId(
            @Param("courseId") Long courseId,
            @Param("academicYearId") Long academicYearId
    );

    @Query("""
            select
                courseOfferingTerm.term.id as termId,
                count(distinct courseOffering.id) as courseOfferingCount
            from CourseOffering courseOffering
            join courseOffering.courseOfferingTerms courseOfferingTerm
            where courseOfferingTerm.term.id in :termIds
            group by courseOfferingTerm.term.id
            """)
    List<TermCourseOfferingCount> countByTermIds(@Param("termIds") List<Long> termIds);
}
