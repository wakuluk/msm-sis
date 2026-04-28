package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseSection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "courseOffering",
            "courseOffering.courseVersion",
            "courseOffering.courseVersion.course",
            "courseOffering.courseVersion.course.subject",
            "subTerm",
            "academicDivision",
            "status",
            "deliveryMode",
            "gradingBasis"
    })
    Optional<CourseSection> findById(Long id);

    @EntityGraph(attributePaths = {
            "courseOffering",
            "subTerm",
            "academicDivision",
            "status",
            "deliveryMode",
            "gradingBasis"
    })
    @Query("""
            select courseSection
            from CourseSection courseSection
            where courseSection.courseOffering.id = :courseOfferingId
            """)
    Page<CourseSection> findAllByCourseOfferingId(
            @Param("courseOfferingId") Long courseOfferingId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "courseOffering",
            "subTerm",
            "academicDivision",
            "status",
            "deliveryMode",
            "gradingBasis"
    })
    @Query("""
            select courseSection
            from CourseSection courseSection
            where courseSection.courseOffering.id = :courseOfferingId
              and courseSection.subTerm.id = :subTermId
            """)
    Page<CourseSection> findAllByCourseOfferingIdAndSubTermId(
            @Param("courseOfferingId") Long courseOfferingId,
            @Param("subTermId") Long subTermId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "courseOffering",
            "subTerm",
            "academicDivision",
            "status",
            "deliveryMode",
            "gradingBasis"
    })
    @Query("""
            select courseSection
            from CourseSection courseSection
            where courseSection.courseOffering.id = :courseOfferingId
              and courseSection.subTerm.id = :subTermId
            """)
    List<CourseSection> findAllByCourseOfferingIdAndSubTermId(
            @Param("courseOfferingId") Long courseOfferingId,
            @Param("subTermId") Long subTermId,
            Sort sort
    );

    @Query("""
            select
                case when count(courseSection) > 0 then true else false end
            from CourseSection courseSection
            where courseSection.courseOffering.id = :courseOfferingId
              and courseSection.subTerm.id = :subTermId
              and lower(courseSection.sectionLetter) = lower(:sectionLetter)
              and courseSection.honors = :honors
              and courseSection.lab = :lab
            """)
    boolean existsByNaturalKey(
            @Param("courseOfferingId") Long courseOfferingId,
            @Param("subTermId") Long subTermId,
            @Param("sectionLetter") String sectionLetter,
            @Param("honors") boolean honors,
            @Param("lab") boolean lab
    );

    @Query("""
            select
                case when count(courseSection) > 0 then true else false end
            from CourseSection courseSection
            where courseSection.courseOffering.id = :courseOfferingId
              and courseSection.subTerm.id = :subTermId
              and lower(courseSection.sectionLetter) = lower(:sectionLetter)
              and courseSection.honors = :honors
              and courseSection.lab = :lab
              and courseSection.id <> :sectionId
            """)
    boolean existsByNaturalKeyExcludingSection(
            @Param("courseOfferingId") Long courseOfferingId,
            @Param("subTermId") Long subTermId,
            @Param("sectionLetter") String sectionLetter,
            @Param("honors") boolean honors,
            @Param("lab") boolean lab,
            @Param("sectionId") Long sectionId
    );
}
