package com.msm.sis.api.mapper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.msm.sis.api.dto.StudentProfileResponse;
import com.msm.sis.api.entity.Student;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StudentMapperTest {

    private final StudentMapper studentMapper = new StudentMapper();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void studentProfileResponseDoesNotExposeAltId() throws Exception {
        Student student = new Student();
        student.setId(7L);
        student.setFirstName("Grace");
        student.setLastName("Hopper");
        student.setPreferredName("Amazing Grace");
        student.setAltId("ALT-999");
        student.setEmail("grace@example.com");

        StudentProfileResponse response = studentMapper.toStudentProfileResponse(student);
        JsonNode payload = objectMapper.readTree(objectMapper.writeValueAsBytes(response));

        assertThat(response.studentId()).isEqualTo(7L);
        assertThat(response.fullName()).isEqualTo("Grace Hopper");
        assertThat(payload.has("altId")).isFalse();
        assertThat(payload.path("email").asText()).isEqualTo("grace@example.com");
    }
}
