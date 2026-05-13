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
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "academic_career_registration_division",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_academic_career_registration_division",
                        columnNames = {"academic_career_id", "academic_division_id"}
                )
        }
)
public class AcademicCareerRegistrationDivision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "academic_career_registration_division_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_career_id", nullable = false)
    private AcademicCareer academicCareer;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_division_id", nullable = false)
    private AcademicDivision academicDivision;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
