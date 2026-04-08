package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Student;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    //TODO: WHOA that name needs to change.
    List<Student> findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(
            String lastName,
            String firstName
    );

    @EntityGraph(attributePaths = {"ethnicity", "classStanding", "address"})
    Optional<Student> findByUserId(Long userId);
}
