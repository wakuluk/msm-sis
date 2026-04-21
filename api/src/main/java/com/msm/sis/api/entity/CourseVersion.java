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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "course_version",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_course_version_course_version", columnNames = {"course_id", "version_number"})
        }
)
public class CourseVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_version_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "catalog_description")
    private String catalogDescription;

    @Column(name = "min_credits", nullable = false, precision = 4, scale = 2)
    private BigDecimal minCredits;

    @Column(name = "max_credits", nullable = false, precision = 4, scale = 2)
    private BigDecimal maxCredits;

    @Column(name = "is_variable_credit", nullable = false)
    private boolean variableCredit;

    @Column(name = "is_current", nullable = false)
    private boolean currentVersion;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
