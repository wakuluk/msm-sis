package com.msm.sis.api.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "name_suffix")
    private String nameSuffix;

    @Column(name = "gender_id")
    private Integer genderId;

    @Column(name = "ethnicity_id")
    private Integer ethnicityId;

    @Column(name = "class_standing_id")
    private Integer classStandingId;

    @Column(name = "address_id")
    private Long addressId;

    @Column(name = "preferred_name")
    private String preferredName;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gender_id", insertable = false, updatable = false)
    private Gender genderLookup;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ethnicity_id", insertable = false, updatable = false)
    private Ethnicity ethnicity;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_standing_id", insertable = false, updatable = false)
    private ClassStanding classStanding;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", insertable = false, updatable = false)
    private Address address;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "ssn_encrypted")
    private byte[] ssnEncrypted;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "ssn_lookup_hash")
    private String ssnLookupHash;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "estimated_grad_date")
    private LocalDate estimatedGradDate;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "alt_id")
    private String altId;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "is_disabled", nullable = false)
    private boolean disabled;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "last_updated", insertable = false, updatable = false)
    private LocalDateTime lastUpdated;

    @Column(name = "updated_by")
    private String updatedBy;
}
