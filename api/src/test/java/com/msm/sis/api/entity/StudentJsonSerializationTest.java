package com.msm.sis.api.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StudentJsonSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void altIdIsNotIncludedInSerializedStudentResponses() throws Exception {
        Student student = new Student();
        student.setId(42L);
        student.setFirstName("Ada");
        student.setLastName("Lovelace");
        student.setAltId("ALT-123");

        JsonNode payload = objectMapper.readTree(objectMapper.writeValueAsBytes(student));

        assertThat(payload.has("altId")).isFalse();
        assertThat(payload.path("id").asLong()).isEqualTo(42L);
        assertThat(payload.path("firstName").asText()).isEqualTo("Ada");
        assertThat(payload.path("lastName").asText()).isEqualTo("Lovelace");
    }
}
