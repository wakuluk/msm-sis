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
public class CourseOfferingTermId implements Serializable {

    @Column(name = "course_offering_id")
    private Long courseOfferingId;

    @Column(name = "term_id")
    private Long termId;
}
