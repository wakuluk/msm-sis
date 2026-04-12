package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.year.AcademicYearSearchCriteria;
import com.msm.sis.api.dto.academic.year.AcademicYearSearchResponse;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicYearServiceTest {

    @Mock
    private AcademicYearRepository academicYearRepository;

    @Mock
    private AcademicTermRepository academicTermRepository;

    @Mock
    private AcademicValidationService academicValidationService;

    @Mock
    private AcademicTermService academicTermService;

    @Mock
    private AcademicYearMapper academicYearMapper;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private AcademicYearService academicYearService;

    @Test
    void searchAcademicYearsUsesCriteriaPaginationAndMapsResults() {
        AcademicYearSearchCriteria criteria = new AcademicYearSearchCriteria();
        criteria.setQuery("2026");
        criteria.setActive(true);
        criteria.setCurrentOnly(true);
        criteria.setSortBy("name");
        criteria.setSortDirection("asc");
        criteria.setPage(2);
        criteria.setSize(10);

        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(5L);
        academicYear.setCode("AY-2026-2027");
        academicYear.setName("Academic Year 2026-2027");
        academicYear.setStartDate(LocalDate.of(2026, 8, 1));
        academicYear.setEndDate(LocalDate.of(2027, 5, 31));
        academicYear.setActive(true);
        academicYear.setPublished(true);

        AcademicYearSearchResponse response = new AcademicYearSearchResponse(
                5L,
                "AY-2026-2027",
                "Academic Year 2026-2027",
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2027, 5, 31),
                true,
                true
        );

        when(academicYearRepository.findAll(org.mockito.ArgumentMatchers.<Specification<AcademicYear>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(academicYear)));
        when(academicYearMapper.toAcademicYearSearchResponse(academicYear)).thenReturn(response);

        List<AcademicYearSearchResponse> results = academicYearService.searchAcademicYears(criteria);

        assertThat(results).containsExactly(response);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(academicYearRepository).findAll(org.mockito.ArgumentMatchers.<Specification<AcademicYear>>any(), pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        assertThat(pageable.getPageNumber()).isEqualTo(2);
        assertThat(pageable.getPageSize()).isEqualTo(10);
        assertThat(pageable.getSort().getOrderFor("name")).isNotNull();
        assertThat(pageable.getSort().getOrderFor("name").getDirection())
                .isEqualTo(org.springframework.data.domain.Sort.Direction.ASC);
    }

    @Test
    void searchAcademicYearsRejectsInvalidSortBy() {
        AcademicYearSearchCriteria criteria = new AcademicYearSearchCriteria();
        criteria.setSortBy("termCount");

        assertThatThrownBy(() -> academicYearService.searchAcademicYears(criteria))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Sort by must be one of");
    }
}
