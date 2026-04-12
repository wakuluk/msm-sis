package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AcademicYearMapperTest {

    private final AcademicYearMapper academicYearMapper = new AcademicYearMapper();

    @Test
    void mapsCreateAcademicYearRequestToEntityWithDefaultState() {
        CreateAcademicYearRequest request = new CreateAcademicYearRequest(
                " AY-2026-2027 ",
                " Academic Year 2026-2027 ",
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2027, 5, 31),
                List.of()
        );

        AcademicYear academicYear = academicYearMapper.fromCreateAcademicYearRequest(request);

        assertThat(academicYear.getCode()).isEqualTo("AY-2026-2027");
        assertThat(academicYear.getName()).isEqualTo("Academic Year 2026-2027");
        assertThat(academicYear.getStartDate()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(academicYear.getEndDate()).isEqualTo(LocalDate.of(2027, 5, 31));
        assertThat(academicYear.isActive()).isFalse();
        assertThat(academicYear.isPublished()).isFalse();
    }

    @Test
    void mapsCreateAcademicYearTermRequestToAcademicTerm() {
        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(7L);

        AcademicTermStatus termStatus = new AcademicTermStatus();
        termStatus.setCode("REGISTRATION_OPEN");
        termStatus.setName("Registration Open");

        CreateAcademicYearTermRequest request = new CreateAcademicYearTermRequest(
                " FALL-2026 ",
                " Fall 2026 ",
                LocalDate.of(2026, 8, 24),
                LocalDate.of(2026, 12, 11),
                202630
        );

        AcademicTerm term = academicYearMapper.fromCreateAcademicYearTermRequest(
                academicYear,
                termStatus,
                request
        );

        assertThat(term.getAcademicYear()).isSameAs(academicYear);
        assertThat(term.getCode()).isEqualTo("FALL-2026");
        assertThat(term.getName()).isEqualTo("Fall 2026");
        assertThat(term.getSortOrder()).isEqualTo(202630);
        assertThat(term.getStatus()).isSameAs(termStatus);
        assertThat(term.isActive()).isTrue();
    }

    @Test
    void mapsCreateAcademicTermRequestToAcademicTerm() {
        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(9L);

        AcademicTermStatus termStatus = new AcademicTermStatus();
        termStatus.setCode("PLANNED");
        termStatus.setName("Planned");

        CreateAcademicTermRequest request = new CreateAcademicTermRequest(
                9L,
                " SPRING-2027 ",
                " Spring 2027 ",
                LocalDate.of(2027, 1, 19),
                LocalDate.of(2027, 5, 7),
                202710
        );

        AcademicTerm term = academicYearMapper.fromCreateAcademicTermRequest(
                academicYear,
                termStatus,
                request
        );

        assertThat(term.getAcademicYear()).isSameAs(academicYear);
        assertThat(term.getCode()).isEqualTo("SPRING-2027");
        assertThat(term.getName()).isEqualTo("Spring 2027");
        assertThat(term.getStatus()).isSameAs(termStatus);
        assertThat(term.isActive()).isTrue();
    }

    @Test
    void mapsAcademicYearResponseWithSortedTerms() {
        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(5L);
        academicYear.setCode("AY-2026-2027");
        academicYear.setName("Academic Year 2026-2027");
        academicYear.setStartDate(LocalDate.of(2026, 8, 1));
        academicYear.setEndDate(LocalDate.of(2027, 5, 31));
        academicYear.setActive(true);
        academicYear.setPublished(true);

        AcademicTermStatus planned = new AcademicTermStatus();
        planned.setCode("PLANNED");
        planned.setName("Planned");

        AcademicTerm spring = new AcademicTerm();
        spring.setId(2L);
        spring.setAcademicYear(academicYear);
        spring.setCode("SPRING-2027");
        spring.setName("Spring 2027");
        spring.setStartDate(LocalDate.of(2027, 1, 19));
        spring.setEndDate(LocalDate.of(2027, 5, 7));
        spring.setSortOrder(202710);
        spring.setStatus(planned);
        spring.setActive(true);

        AcademicTerm fall = new AcademicTerm();
        fall.setId(1L);
        fall.setAcademicYear(academicYear);
        fall.setCode("FALL-2026");
        fall.setName("Fall 2026");
        fall.setStartDate(LocalDate.of(2026, 8, 24));
        fall.setEndDate(LocalDate.of(2026, 12, 11));
        fall.setSortOrder(202630);
        fall.setStatus(planned);
        fall.setActive(true);

        var response = academicYearMapper.toAcademicYearResponse(academicYear, List.of(spring, fall));

        assertThat(response.academicYearId()).isEqualTo(5L);
        assertThat(response.isPublished()).isTrue();
        assertThat(response.terms()).extracting(term -> term.code())
                .containsExactly("FALL-2026", "SPRING-2027");
    }
}
