package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    @EntityGraph(attributePaths = {"genderLookup", "ethnicity", "classStanding", "address"})
    Optional<Student> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"genderLookup", "ethnicity", "classStanding", "address"})
    @Query("select student from Student student where student.id = :studentId")
    Optional<Student> findByIdWithDetails(@Param("studentId") Long studentId);

    @EntityGraph(attributePaths = {"genderLookup", "classStanding", "address"})
    @Query("""
            select student
            from Student student
            left join student.address address
            where (:studentId is null or student.id = :studentId)
              and (:firstName is null or lower(student.firstName) like concat('%', lower(cast(:firstName as string)), '%'))
              and (:lastName is null or lower(student.lastName) like concat('%', lower(cast(:lastName as string)), '%'))
              and (:updatedBy is null or lower(student.updatedBy) like concat('%', lower(cast(:updatedBy as string)), '%'))
              and (:genderId is null or student.genderId = :genderId)
              and (:ethnicityId is null or student.ethnicityId = :ethnicityId)
              and (:classStandingId is null or student.classStandingId = :classStandingId)
              and (:classOf is null or extract(year from student.estimatedGradDate) = :classOf)
              and (:addressLine1 is null or lower(address.addressLine1) like concat('%', lower(cast(:addressLine1 as string)), '%'))
              and (:addressLine2 is null or lower(address.addressLine2) like concat('%', lower(cast(:addressLine2 as string)), '%'))
              and (:city is null or lower(address.city) like concat('%', lower(cast(:city as string)), '%'))
              and (:stateRegion is null or lower(address.stateRegion) like concat('%', lower(cast(:stateRegion as string)), '%'))
              and (:postalCode is null or lower(address.postalCode) like concat('%', lower(cast(:postalCode as string)), '%'))
              and (:countryCode is null or lower(address.countryCode) = lower(cast(:countryCode as string)))
            """)
    Page<Student> searchStudents(
            @Param("studentId") Long studentId,
            @Param("firstName") String firstName,
            @Param("lastName") String lastName,
            @Param("updatedBy") String updatedBy,
            @Param("genderId") Integer genderId,
            @Param("ethnicityId") Integer ethnicityId,
            @Param("classStandingId") Integer classStandingId,
            @Param("classOf") Integer classOf,
            @Param("addressLine1") String addressLine1,
            @Param("addressLine2") String addressLine2,
            @Param("city") String city,
            @Param("stateRegion") String stateRegion,
            @Param("postalCode") String postalCode,
            @Param("countryCode") String countryCode,
            Pageable pageable
    );
}
