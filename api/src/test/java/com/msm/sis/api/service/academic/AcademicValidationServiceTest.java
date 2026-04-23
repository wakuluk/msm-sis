package com.msm.sis.api.service.academic;

import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicValidationServiceTest {

    @Mock
    private AcademicYearRepository academicYearRepository;

    @Mock
    private AcademicSubTermRepository academicTermRepository;

    @InjectMocks
    private AcademicValidationService academicValidationService;

    @Test
    void validatePatchAcademicYearAllowsExistingCodeOnSameRecord() {
        AcademicYear existingAcademicYear = buildAcademicYear(5L, "AY-2026-2027");
        AcademicYear candidateAcademicYear = buildAcademicYear(5L, "AY-2026-2027");

        assertThatCode(() -> academicValidationService.validatePatchAcademicYear(
                existingAcademicYear,
                candidateAcademicYear
        ))
                .doesNotThrowAnyException();

        verifyNoInteractions(academicYearRepository);
    }

    @Test
    void validatePatchAcademicYearRejectsDuplicateCodeOnDifferentRecord() {
        AcademicYear existingAcademicYear = buildAcademicYear(5L, "AY-2026-2027");
        AcademicYear candidateAcademicYear = buildAcademicYear(5L, "AY-2027-2028");
        when(academicYearRepository.existsByCode("AY-2027-2028")).thenReturn(true);

        assertThatThrownBy(() -> academicValidationService.validatePatchAcademicYear(
                existingAcademicYear,
                candidateAcademicYear
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Academic year code already exists.");

        verify(academicYearRepository).existsByCode("AY-2027-2028");
    }

    private AcademicYear buildAcademicYear(Long id, String code) {
        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(id);
        academicYear.setCode(code);
        academicYear.setName("Academic Year 2026-2027");
        academicYear.setStartDate(LocalDate.of(2026, 8, 1));
        academicYear.setEndDate(LocalDate.of(2027, 5, 31));
        return academicYear;
    }
}
