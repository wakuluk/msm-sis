package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseSectionInstructor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseSectionInstructorRepository extends JpaRepository<CourseSectionInstructor, Long> {

    @EntityGraph(attributePaths = {"courseSection", "staff", "role"})
    List<CourseSectionInstructor> findAllByCourseSection_IdOrderByPrimaryDescStaff_LastNameAscStaff_FirstNameAsc(
            Long sectionId
    );

    @Modifying
    @Query("""
            delete from CourseSectionInstructor instructor
            where instructor.courseSection.id = :sectionId
            """)
    void deleteAllByCourseSectionId(@Param("sectionId") Long sectionId);
}
