package com.msm.sis.api.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transfer_credit_policy")
public class TransferCreditPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_credit_policy_id")
    private Long id;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "effective_start_date", nullable = false)
    private LocalDate effectiveStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "effective_end_date")
    private LocalDate effectiveEndDate;

    @Column(name = "minimum_transfer_grade", nullable = false)
    private String minimumTransferGrade = "C-";

    @Column(name = "four_year_institution_credit_threshold", nullable = false)
    private Integer fourYearInstitutionCreditThreshold = 75;

    @Column(name = "require_transcript_pdf", nullable = false)
    private boolean requireTranscriptPdf = true;

    @Column(name = "notes")
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
