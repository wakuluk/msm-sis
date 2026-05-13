package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseSection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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
            "subTerm.status",
            "academicDivision",
            "status",
            "deliveryMode",
            "gradingBasis"
    })
    Optional<CourseSection> findById(Long id);

    @EntityGraph(attributePaths = {
            "courseOffering",
            "courseOffering.courseVersion",
            "courseOffering.courseVersion.course",
            "courseOffering.courseVersion.course.subject",
            "subTerm",
            "subTerm.status",
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
    @Query("""
            select courseSection
            from CourseSection courseSection
            join courseSection.courseOffering courseOffering
            join courseOffering.courseVersion courseVersion
            join courseVersion.course course
            left join course.subject subject
            where courseSection.subTerm.id = :subTermId
            order by subject.code asc,
                     course.courseNumber asc,
                     courseSection.sectionLetter asc,
                     courseSection.id asc
            """)
    List<CourseSection> findAllForStagingBySubTermId(@Param("subTermId") Long subTermId);

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
    @Query("""
            select courseSection
            from CourseSection courseSection
            join courseSection.courseOffering courseOffering
            join courseOffering.courseVersion courseVersion
            join courseVersion.course course
            left join course.subject subject
            where courseSection.id in :sectionIds
            order by subject.code asc,
                     course.courseNumber asc,
                     courseSection.sectionLetter asc,
                     courseSection.id asc
            """)
    List<CourseSection> findAllForStagingByIdIn(@Param("sectionIds") Collection<Long> sectionIds);

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
    @Query("""
            select courseSection
            from CourseSection courseSection
            join courseSection.courseOffering courseOffering
            join courseOffering.courseVersion courseVersion
            join courseVersion.course course
            left join course.subject subject
            join courseSection.status status
            where courseSection.subTerm.id in :subTermIds
              and upper(status.code) = 'PLANNED'
            order by subject.code asc,
                     course.courseNumber asc,
                     courseSection.sectionLetter asc,
                     courseSection.id asc
            """)
    List<CourseSection> findAvailableForStudentRegistrationBySubTermIds(
            @Param("subTermIds") Collection<Long> subTermIds
    );

    @Query("""
            select
                case when count(courseSection) > 0 then true else false end
            from CourseSection courseSection
            where courseSection.courseOffering.id = :courseOfferingId
              and courseSection.subTerm.id = :subTermId
              and lower(courseSection.sectionLetter) = lower(:sectionLetter)
              and courseSection.honors = :honors
            """)
    boolean existsByNaturalKey(
            @Param("courseOfferingId") Long courseOfferingId,
            @Param("subTermId") Long subTermId,
            @Param("sectionLetter") String sectionLetter,
            @Param("honors") boolean honors
    );

    @Query("""
            select
                case when count(courseSection) > 0 then true else false end
            from CourseSection courseSection
            where courseSection.courseOffering.id = :courseOfferingId
              and courseSection.subTerm.id = :subTermId
              and lower(courseSection.sectionLetter) = lower(:sectionLetter)
              and courseSection.honors = :honors
              and courseSection.id <> :sectionId
            """)
    boolean existsByNaturalKeyExcludingSection(
            @Param("courseOfferingId") Long courseOfferingId,
            @Param("subTermId") Long subTermId,
            @Param("sectionLetter") String sectionLetter,
            @Param("honors") boolean honors,
            @Param("sectionId") Long sectionId
    );

    @Query("""
            select
                case when count(courseSection) > 0 then true else false end
            from CourseSection courseSection
            join courseSection.status status
            where courseSection.courseOffering.id = :courseOfferingId
              and courseSection.subTerm.id = :subTermId
              and courseSection.honors = true
              and upper(status.code) = 'PLANNED'
              and courseSection.id <> :sectionId
            """)
    boolean existsPlannedHonorsSectionForOfferingAndSubTermExcludingSection(
            @Param("courseOfferingId") Long courseOfferingId,
            @Param("subTermId") Long subTermId,
            @Param("sectionId") Long sectionId
    );
}
