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

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "student_program_request")
public class StudentProgramRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_program_request_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = false)
    private Program program;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_program_id")
    private StudentProgram studentProgram;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_program_version_id", nullable = false)
    private ProgramVersion requestedProgramVersion;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_approved_program_version_id")
    private ProgramVersion departmentApprovedProgramVersion;

    @Column(name = "status", nullable = false)
    private String status = "REQUESTED";

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "department_reviewed_at")
    private LocalDateTime departmentReviewedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_reviewed_by_user_id")
    private SisUser departmentReviewedByUser;

    @Column(name = "department_signature_name", length = 255)
    private String departmentSignatureName;

    @Column(name = "department_signature_email", length = 255)
    private String departmentSignatureEmail;

    @Column(name = "department_comment", length = 1000)
    private String departmentComment;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "admin_reviewed_at")
    private LocalDateTime adminReviewedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_reviewed_by_user_id")
    private SisUser adminReviewedByUser;

    @Column(name = "admin_signature_name", length = 255)
    private String adminSignatureName;

    @Column(name = "admin_signature_email", length = 255)
    private String adminSignatureEmail;

    @Column(name = "admin_comment", length = 1000)
    private String adminComment;

    @Column(name = "notes", length = 500)
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
