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
@Table(name = "transfer_request")
public class TransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_request_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_credit_policy_id", nullable = false)
    private TransferCreditPolicy policy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_institution_id")
    private TransferInstitution transferInstitution;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_matched_by_user_id")
    private SisUser institutionMatchedByUser;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "institution_matched_at")
    private LocalDateTime institutionMatchedAt;

    @Column(name = "one_off_institution_name")
    private String oneOffInstitutionName;

    @Column(name = "one_off_institution_address_line_1")
    private String oneOffInstitutionAddressLine1;

    @Column(name = "one_off_institution_address_line_2")
    private String oneOffInstitutionAddressLine2;

    @Column(name = "one_off_institution_city")
    private String oneOffInstitutionCity;

    @Column(name = "one_off_institution_state_region")
    private String oneOffInstitutionStateRegion;

    @Column(name = "one_off_institution_postal_code")
    private String oneOffInstitutionPostalCode;

    @Column(name = "one_off_institution_country_code", length = 2)
    private String oneOffInstitutionCountryCode;

    @Column(name = "one_off_institution_website")
    private String oneOffInstitutionWebsite;

    @Column(name = "institution_level", length = 20)
    private String institutionLevel;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "SUBMITTED";

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_user_id")
    private SisUser decidedByUser;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decision_notes")
    private String decisionNotes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
