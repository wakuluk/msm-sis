package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.dto.academic.year.PatchAcademicYearRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicYearStatus;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermStatus;
import com.msm.sis.api.patch.PatchValue;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
        assertThat(academicYear.getStatus()).isNull();
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
        AcademicYearStatus activeStatus = new AcademicYearStatus();
        activeStatus.setCode("ACTIVE");
        activeStatus.setName("Active");
        academicYear.setId(5L);
        academicYear.setCode("AY-2026-2027");
        academicYear.setName("Academic Year 2026-2027");
        academicYear.setStartDate(LocalDate.of(2026, 8, 1));
        academicYear.setEndDate(LocalDate.of(2027, 5, 31));
        academicYear.setStatus(activeStatus);
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

    @Test
    void copiesAcademicYearIntoDetachedCandidate() {
        AcademicYear academicYear = new AcademicYear();
        AcademicYearStatus activeStatus = new AcademicYearStatus();
        activeStatus.setCode("ACTIVE");
        activeStatus.setName("Active");
        academicYear.setId(5L);
        academicYear.setCode("AY-2026-2027");
        academicYear.setName("Academic Year 2026-2027");
        academicYear.setStartDate(LocalDate.of(2026, 8, 1));
        academicYear.setEndDate(LocalDate.of(2027, 5, 31));
        academicYear.setStatus(activeStatus);
        academicYear.setActive(true);
        academicYear.setPublished(true);
        academicYear.setLastUpdated(LocalDateTime.of(2026, 1, 2, 3, 4, 5));
        academicYear.setUpdatedBy("admin@example.com");

        AcademicYear copy = academicYearMapper.copy(academicYear);

        assertThat(copy).isNotSameAs(academicYear);
        assertThat(copy.getId()).isEqualTo(5L);
        assertThat(copy.getCode()).isEqualTo("AY-2026-2027");
        assertThat(copy.getName()).isEqualTo("Academic Year 2026-2027");
        assertThat(copy.getStartDate()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(copy.getEndDate()).isEqualTo(LocalDate.of(2027, 5, 31));
        assertThat(copy.getStatus()).isSameAs(activeStatus);
        assertThat(copy.isActive()).isTrue();
        assertThat(copy.isPublished()).isTrue();
        assertThat(copy.getLastUpdated()).isEqualTo(LocalDateTime.of(2026, 1, 2, 3, 4, 5));
        assertThat(copy.getUpdatedBy()).isEqualTo("admin@example.com");
    }

    @Test
    void copiesPatchableFieldsBackToManagedEntity() {
        AcademicYear target = new AcademicYear();
        target.setCode("AY-2026-2027");
        target.setName("Academic Year 2026-2027");
        target.setStartDate(LocalDate.of(2026, 8, 1));
        target.setEndDate(LocalDate.of(2027, 5, 31));
        target.setActive(true);
        target.setPublished(true);

        AcademicYear source = academicYearMapper.copy(target);
        PatchAcademicYearRequest request = new PatchAcademicYearRequest();
        request.setCode(PatchValue.of(" AY-2027-2028 "));
        request.setName(PatchValue.of(" Academic Year 2027-2028 "));
        request.setStartDate(PatchValue.of(LocalDate.of(2027, 8, 1)));
        request.setEndDate(PatchValue.of(LocalDate.of(2028, 5, 31)));
        academicYearMapper.applyPatch(source, request);

        academicYearMapper.copyPatchableFields(source, target);

        assertThat(target.getCode()).isEqualTo("AY-2027-2028");
        assertThat(target.getName()).isEqualTo("Academic Year 2027-2028");
        assertThat(target.getStartDate()).isEqualTo(LocalDate.of(2027, 8, 1));
        assertThat(target.getEndDate()).isEqualTo(LocalDate.of(2028, 5, 31));
        assertThat(target.isActive()).isTrue();
        assertThat(target.isPublished()).isTrue();
    }
}
