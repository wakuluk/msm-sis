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
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "registration_group_generation")
public class RegistrationGroupGeneration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_group_generation_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "term_id", nullable = false)
    private AcademicTerm term;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "student_search_text")
    private String studentSearchText;

    @Column(name = "program_search_text")
    private String programSearchText;

    @Column(name = "group_name_prefix")
    private String groupNamePrefix;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_division_id")
    private AcademicDivision academicDivision;

    @Column(name = "honors_filter", nullable = false, length = 30)
    private String honorsFilter = "ANY";

    @Column(name = "athlete_filter", nullable = false, length = 30)
    private String athleteFilter = "ANY";

    @Column(name = "existing_group_filter", nullable = false, length = 40)
    private String existingGroupFilter = "EXCLUDE_ALREADY_GROUPED";

    @Column(name = "min_credits", precision = 5, scale = 2)
    private BigDecimal minCredits;

    @Column(name = "max_credits", precision = 5, scale = 2)
    private BigDecimal maxCredits;

    @Column(name = "include_current_credits", nullable = false)
    private boolean includeCurrentCredits = true;

    @Column(name = "include_transfer_credits", nullable = false)
    private boolean includeTransferCredits = true;

    @Column(name = "split_count", nullable = false)
    private Integer splitCount = 1;

    @Column(name = "matched_student_count", nullable = false)
    private Integer matchedStudentCount = 0;

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
