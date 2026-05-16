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
@Table(name = "billing_period")
public class BillingPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "billing_period_id")
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 64)
    private String name;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "type", nullable = false, length = 32)
    private String type = "STANDARD";

    @Column(name = "status", nullable = false, length = 32)
    private String status = "DRAFT";

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id")
    private AcademicYear academicYear;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "term_id")
    private AcademicTerm term;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "start_date")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "end_date")
    private LocalDate endDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "actual_start_preliminary_end_date")
    private LocalDate actualStartPreliminaryEndDate;

    @Column(name = "tax_academic_year", length = 32)
    private String taxAcademicYear;

    @Column(name = "tax_academic_year_label", length = 64)
    private String taxAcademicYearLabel;

    @Column(name = "tax_academic_term_code", length = 32)
    private String taxAcademicTermCode;

    @Column(name = "tax_academic_term_name", length = 128)
    private String taxAcademicTermName;

    @Column(name = "financial_aid_period_code", length = 64)
    private String financialAidPeriodCode;

    @Column(name = "financial_aid_period_name", length = 128)
    private String financialAidPeriodName;

    @Column(name = "course_billing_basis", nullable = false, length = 64)
    private String courseBillingBasis = "BILLING_PERIOD_START_DATE";

    @Column(name = "non_course_billing_basis", nullable = false, length = 64)
    private String nonCourseBillingBasis = "BILLING_PERIOD_START_DATE";

    @Column(name = "actual_from_to_days", nullable = false)
    private Integer actualFromToDays = 0;

    @Column(name = "preliminary_from_to_days", nullable = false)
    private Integer preliminaryFromToDays = 0;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "allow_re_billing", nullable = false)
    private boolean allowReBilling = false;

    @Column(name = "allow_ar_billing", nullable = false)
    private boolean allowArBilling = true;

    @Column(name = "include_in_ar_statements", nullable = false)
    private boolean includeInArStatements = false;

    @Column(name = "allow_billing_in_campus_portal", nullable = false)
    private boolean allowBillingInCampusPortal = false;

    @Column(name = "run_prelim_in_campus_portal_only", nullable = false)
    private boolean runPrelimInCampusPortalOnly = false;

    @Column(name = "academic_records_mapped", nullable = false)
    private boolean academicRecordsMapped = false;

    @Column(name = "children_assigned", nullable = false)
    private boolean childrenAssigned = false;

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
