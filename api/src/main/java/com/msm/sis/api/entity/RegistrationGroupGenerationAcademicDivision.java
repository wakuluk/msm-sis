package com.msm.sis.api.entity;

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
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
        name = "registration_group_generation_academic_division",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_registration_group_generation_academic_division",
                        columnNames = {"registration_group_generation_id", "academic_division_id"}
                )
        }
)
public class RegistrationGroupGenerationAcademicDivision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_group_generation_academic_division_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_group_generation_id", nullable = false)
    private RegistrationGroupGeneration registrationGroupGeneration;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_division_id", nullable = false)
    private AcademicDivision academicDivision;
}
