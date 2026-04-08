package com.msm.sis.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentSearchCriteria {
    private Long studentId;
    private String firstName;
    private String lastName;
    private String updatedBy;
    private Integer classOf;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String stateRegion;
    private String postalCode;
    private String countryCode;
}
