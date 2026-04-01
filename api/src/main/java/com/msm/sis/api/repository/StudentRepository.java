package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(
            String lastName,
            String firstName
    );
}
