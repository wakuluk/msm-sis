package com.msm.sis.api.service.student;

import org.springframework.stereotype.Component;

@Component
public class CourseNumberParser {

    public Integer parse(String courseNumber) {
        if (courseNumber == null) {
            return null;
        }

        String digits = courseNumber.replaceAll("\\D.*$", "");
        if (digits.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
