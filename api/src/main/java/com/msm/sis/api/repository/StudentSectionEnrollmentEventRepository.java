package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionEnrollmentEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentSectionEnrollmentEventRepository
        extends JpaRepository<StudentSectionEnrollmentEvent, Long> {

    @EntityGraph(attributePaths = {
            "studentSectionEnrollment",
            "fromStatus",
            "toStatus",
            "actorUser"
    })
    @Query("""
            select event
            from StudentSectionEnrollmentEvent event
            where event.studentSectionEnrollment.id = :enrollmentId
            order by event.createdAt desc, event.id desc
            """)
    Page<StudentSectionEnrollmentEvent> findPageByEnrollmentId(
            @Param("enrollmentId") Long enrollmentId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "studentSectionEnrollment",
            "studentSectionEnrollment.courseSection",
            "fromStatus",
            "toStatus",
            "actorUser"
    })
    @Query("""
            select event
            from StudentSectionEnrollmentEvent event
            where event.studentSectionEnrollment.courseSection.id = :sectionId
            order by event.createdAt desc, event.id desc
            """)
    Page<StudentSectionEnrollmentEvent> findPageBySectionId(
            @Param("sectionId") Long sectionId,
            Pageable pageable
    );
}
