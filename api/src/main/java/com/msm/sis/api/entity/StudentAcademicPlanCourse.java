package com.msm.sis.api.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "student_academic_plan_course")
public class StudentAcademicPlanCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_academic_plan_course_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_academic_plan_term_id", nullable = false)
    private StudentAcademicPlanTerm studentAcademicPlanTerm;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_program_id")
    private StudentProgram studentProgram;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id")
    private Requirement requirement;

    @Column(name = "status", nullable = false)
    private String status = "PLANNED";

    @Column(name = "credits")
    private BigDecimal credits;

    @Column(name = "planner_bucket_code")
    private String plannerBucketCode;

    @Column(name = "planner_bucket_label")
    private String plannerBucketLabel;

    @Column(name = "placeholder_type")
    private String placeholderType;

    @Column(name = "placeholder_label")
    private String placeholderLabel;

    @Column(name = "placeholder_subject_code")
    private String placeholderSubjectCode;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "placeholder_department_id")
    private AcademicDepartment placeholderDepartment;

    @Column(name = "placeholder_minimum_course_number")
    private Integer placeholderMinimumCourseNumber;

    @Column(name = "placeholder_maximum_course_number")
    private Integer placeholderMaximumCourseNumber;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "notes")
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private SisUser updatedByUser;
}
