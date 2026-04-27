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
    interface SubTermCourseOfferingCount {
        Long getSubTermId();
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
            "courseOfferingSubTerms",
            "courseOfferingSubTerms.subTerm",
            "courseOfferingSubTerms.subTerm.status",
            "status"
    })
    Optional<CourseOffering> findById(Long id);

    @Query("""
            select distinct courseOffering
            from CourseOffering courseOffering
            join courseOffering.courseOfferingSubTerms courseOfferingSubTerm
            where courseOfferingSubTerm.subTerm.id = :subTermId
            """)
    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "courseVersion.course.subject.department.school",
            "academicYear",
            "courseOfferingSubTerms",
            "courseOfferingSubTerms.subTerm",
            "courseOfferingSubTerms.subTerm.status",
            "status"
    })
    List<CourseOffering> findAllByAcademicSubTermId(@Param("subTermId") Long subTermId, Sort sort);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "courseVersion.course.subject.department.school",
            "academicYear",
            "courseOfferingSubTerms",
            "courseOfferingSubTerms.subTerm",
            "courseOfferingSubTerms.subTerm.status",
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
            "courseOfferingSubTerms",
            "courseOfferingSubTerms.subTerm",
            "courseOfferingSubTerms.subTerm.status",
            "status"
    })
    List<CourseOffering> findAllByAcademicYear_Id(Long academicYearId, Sort sort);

    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "academicYear",
            "courseOfferingSubTerms",
            "courseOfferingSubTerms.subTerm",
            "courseOfferingSubTerms.subTerm.status",
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
            select courseOffering
            from CourseOffering courseOffering
            where courseOffering.courseVersion.course.id = :courseId
              and courseOffering.academicYear.id = :academicYearId
            """)
    @EntityGraph(attributePaths = {
            "courseVersion",
            "courseVersion.course",
            "courseVersion.course.subject",
            "courseVersion.course.subject.department",
            "courseVersion.course.subject.department.school",
            "academicYear",
            "courseOfferingSubTerms",
            "courseOfferingSubTerms.subTerm",
            "courseOfferingSubTerms.subTerm.status",
            "status"
    })
    Optional<CourseOffering> findByCourseIdAndAcademicYearId(
            @Param("courseId") Long courseId,
            @Param("academicYearId") Long academicYearId
    );

    @Query("""
            select
                courseOfferingSubTerm.subTerm.id as subTermId,
                count(distinct courseOffering.id) as courseOfferingCount
            from CourseOffering courseOffering
            join courseOffering.courseOfferingSubTerms courseOfferingSubTerm
            where courseOfferingSubTerm.subTerm.id in :subTermIds
            group by courseOfferingSubTerm.subTerm.id
            """)
    List<SubTermCourseOfferingCount> countBySubTermIds(@Param("subTermIds") List<Long> subTermIds);
}
