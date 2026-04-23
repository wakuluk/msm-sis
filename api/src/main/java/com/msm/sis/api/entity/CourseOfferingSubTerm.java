package com.msm.sis.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "course_offering_sub_term")
public class CourseOfferingSubTerm {

    @EmbeddedId
    private CourseOfferingSubTermId id;

    @JsonIgnore
    @MapsId("courseOfferingId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_offering_id", nullable = false)
    private CourseOffering courseOffering;

    @JsonIgnore
    @MapsId("subTermId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_term_id", nullable = false)
    private AcademicSubTerm subTerm;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;
}
