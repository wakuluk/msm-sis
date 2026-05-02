package com.msm.sis.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "grading_basis")
public class GradingBasis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grading_basis_id")
    private Long id;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "allowed_for_course_sections", nullable = false)
    private boolean allowedForCourseSections = true;

    @Column(name = "allowed_for_student_enrollments", nullable = false)
    private boolean allowedForStudentEnrollments = true;
}
