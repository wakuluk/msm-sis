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
              and (:firstName is null or lower(student.firstName) like lower(concat('%', :firstName, '%')))
              and (:lastName is null or lower(student.lastName) like lower(concat('%', :lastName, '%')))
              and (:updatedBy is null or lower(student.updatedBy) like lower(concat('%', :updatedBy, '%')))
              and (:genderId is null or student.genderId = :genderId)
              and (:ethnicityId is null or student.ethnicityId = :ethnicityId)
              and (:classStandingId is null or student.classStandingId = :classStandingId)
              and (:classOf is null or function('year', student.estimatedGradDate) = :classOf)
              and (:addressLine1 is null or lower(address.addressLine1) like lower(concat('%', :addressLine1, '%')))
              and (:addressLine2 is null or lower(address.addressLine2) like lower(concat('%', :addressLine2, '%')))
              and (:city is null or lower(address.city) like lower(concat('%', :city, '%')))
              and (:stateRegion is null or lower(address.stateRegion) like lower(concat('%', :stateRegion, '%')))
              and (:postalCode is null or lower(address.postalCode) like lower(concat('%', :postalCode, '%')))
              and (:countryCode is null or lower(address.countryCode) = lower(:countryCode))
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
