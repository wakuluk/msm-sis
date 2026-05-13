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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "student_academic_career")
public class StudentAcademicCareer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_academic_career_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_career_id", nullable = false)
    private AcademicCareer academicCareer;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "effective_start_date", nullable = false)
    private LocalDate effectiveStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "effective_end_date")
    private LocalDate effectiveEndDate;

    @Column(name = "primary_career", nullable = false)
    private boolean primaryCareer;

    @Column(name = "entry_reason", length = 50)
    private String entryReason;

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
    @JoinColumn(name = "created_by_user_id")
    private SisUser createdByUser;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private SisUser updatedByUser;
}
