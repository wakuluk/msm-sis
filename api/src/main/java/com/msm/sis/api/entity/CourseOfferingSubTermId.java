package com.msm.sis.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class CourseOfferingSubTermId implements Serializable {

    @Column(name = "course_offering_id")
    private Long courseOfferingId;

    @Column(name = "sub_term_id")
    private Long subTermId;
}
