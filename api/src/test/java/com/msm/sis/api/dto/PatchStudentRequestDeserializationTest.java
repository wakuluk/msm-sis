package com.msm.sis.api.dto;

import com.msm.sis.api.dto.student.PatchStudentRequest;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class PatchStudentRequestDeserializationTest {

    private final JsonMapper objectMapper = JsonMapper.builder().build();

    @Test
    void presentStringFieldDeserializesIntoPresentPatchValue() throws Exception {
        PatchStudentRequest request = objectMapper.readValue(
                """
                {"lastName":"Gloinsoning"}
                """,
                PatchStudentRequest.class
        );

        assertThat(request.getLastName().isPresent()).isTrue();
        assertThat(request.getLastName().getValue()).isEqualTo("Gloinsoning");
        assertThat(request.getFirstName().isPresent()).isFalse();
    }

    @Test
    void explicitNullRemainsPresentSoPatchCanClearField() throws Exception {
        PatchStudentRequest request = objectMapper.readValue(
                """
                {"preferredName":null}
                """,
                PatchStudentRequest.class
        );

        assertThat(request.getPreferredName().isPresent()).isTrue();
        assertThat(request.getPreferredName().getValue()).isNull();
    }
}
