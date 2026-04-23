package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.year.CreateAcademicYearRequest;
import com.msm.sis.api.dto.academic.year.AcademicYearResponse;
import com.msm.sis.api.dto.academic.year.AcademicYearSearchCriteria;
import com.msm.sis.api.dto.academic.year.AcademicYearSearchResponse;
import com.msm.sis.api.dto.academic.year.PatchAcademicYearRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicYearStatus;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.patch.PatchValue;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.AcademicYearStatusRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicYearServiceTest {

    @Mock
    private AcademicYearRepository academicYearRepository;

    @Mock
    private AcademicYearStatusRepository academicYearStatusRepository;

    @Mock
    private AcademicSubTermRepository academicTermRepository;

    @Mock
    private AcademicValidationService academicValidationService;

    @Mock
    private AcademicSubTermService academicTermService;

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

    @Test
    void createAcademicYearAssignsDraftStatusBeforeSave() {
        CreateAcademicYearRequest request = new CreateAcademicYearRequest(
                "AY-2026-2027",
                "Academic Year 2026-2027",
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2027, 5, 31),
                List.of()
        );
        AcademicYear draftAcademicYear = buildAcademicYear(null, "AY-2026-2027");
        AcademicYearStatus draftStatus = new AcademicYearStatus();
        draftStatus.setId(1L);
        draftStatus.setCode("DRAFT");
        draftStatus.setName("Draft");
        draftStatus.setActive(true);
        AcademicYear savedAcademicYear = buildAcademicYear(5L, "AY-2026-2027");
        savedAcademicYear.setStatus(draftStatus);
        AcademicYearResponse response = new AcademicYearResponse(
                5L,
                "AY-2026-2027",
                "Academic Year 2026-2027",
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2027, 5, 31),
                true,
                false,
                null,
                null,
                List.of()
        );

        when(academicYearMapper.fromCreateAcademicYearRequest(request)).thenReturn(draftAcademicYear);
        when(academicYearStatusRepository.findByCode("DRAFT")).thenReturn(Optional.of(draftStatus));
        when(academicYearRepository.save(draftAcademicYear)).thenReturn(savedAcademicYear);
        when(academicYearRepository.findById(5L)).thenReturn(Optional.of(savedAcademicYear));
        when(academicTermRepository.findAllByAcademicYear_IdOrderBySortOrderAsc(5L)).thenReturn(List.of());
        when(academicYearMapper.toAcademicYearResponse(savedAcademicYear, List.of())).thenReturn(response);

        AcademicYearResponse result = academicYearService.createAcademicYear(request);

        assertThat(result).isSameAs(response);
        assertThat(draftAcademicYear.getStatus()).isSameAs(draftStatus);
        verify(academicValidationService).validateCreateAcademicYear(draftAcademicYear);
        verify(academicYearRepository).save(draftAcademicYear);
        verify(academicTermService).createAcademicSubTerms(savedAcademicYear, List.of());
    }

    @Test
    void patchAcademicYearValidatesDetachedCandidateBeforeSavingManagedEntity() {
        PatchAcademicYearRequest request = new PatchAcademicYearRequest();
        request.setCode(PatchValue.of("AY-2027-2028"));

        AcademicYear existingAcademicYear = buildAcademicYear(5L, "AY-2026-2027");
        AcademicYear candidateAcademicYear = buildAcademicYear(5L, "AY-2026-2027");
        AcademicYearResponse response = new AcademicYearResponse(
                5L,
                "AY-2027-2028",
                "Academic Year 2026-2027",
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2027, 5, 31),
                true,
                false,
                null,
                "admin@example.com",
                List.of()
        );

        when(academicYearRepository.findById(5L)).thenReturn(Optional.of(existingAcademicYear));
        when(academicYearMapper.copy(existingAcademicYear)).thenReturn(candidateAcademicYear);
        when(academicTermRepository.findAllByAcademicYear_IdOrderBySortOrderAsc(5L)).thenReturn(List.of());
        when(academicYearMapper.toAcademicYearResponse(existingAcademicYear, List.of())).thenReturn(response);
        doAnswer(invocation -> {
            candidateAcademicYear.setCode("AY-2027-2028");
            return null;
        }).when(academicYearMapper).applyPatch(candidateAcademicYear, request);
        doAnswer(invocation -> {
            AcademicYear source = invocation.getArgument(0);
            AcademicYear target = invocation.getArgument(1);
            target.setCode(source.getCode());
            target.setName(source.getName());
            target.setStartDate(source.getStartDate());
            target.setEndDate(source.getEndDate());
            return null;
        }).when(academicYearMapper).copyPatchableFields(candidateAcademicYear, existingAcademicYear);

        AcademicYearResponse result = academicYearService.patchAcademicYear(5L, request, "admin@example.com");

        assertThat(result).isSameAs(response);
        assertThat(existingAcademicYear.getCode()).isEqualTo("AY-2027-2028");
        assertThat(existingAcademicYear.getUpdatedBy()).isEqualTo("admin@example.com");

        InOrder inOrder = inOrder(academicYearMapper, academicValidationService, academicYearRepository, entityManager);
        inOrder.verify(academicYearMapper).copy(existingAcademicYear);
        inOrder.verify(academicYearMapper).applyPatch(candidateAcademicYear, request);
        inOrder.verify(academicValidationService).validatePatchAcademicYear(
                existingAcademicYear,
                candidateAcademicYear
        );
        inOrder.verify(academicYearMapper).copyPatchableFields(candidateAcademicYear, existingAcademicYear);
        inOrder.verify(academicYearRepository).save(existingAcademicYear);
        inOrder.verify(entityManager).flush();
        inOrder.verify(entityManager).clear();
    }

    @Test
    void patchAcademicYearSkipsSaveWhenPatchProducesNoChanges() {
        PatchAcademicYearRequest request = new PatchAcademicYearRequest();

        AcademicYear existingAcademicYear = buildAcademicYear(5L, "AY-2026-2027");
        AcademicYear candidateAcademicYear = buildAcademicYear(5L, "AY-2026-2027");
        AcademicYearResponse response = new AcademicYearResponse(
                5L,
                "AY-2026-2027",
                "Academic Year 2026-2027",
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2027, 5, 31),
                true,
                false,
                null,
                null,
                List.of()
        );

        when(academicYearRepository.findById(5L)).thenReturn(Optional.of(existingAcademicYear));
        when(academicYearMapper.copy(existingAcademicYear)).thenReturn(candidateAcademicYear);
        when(academicTermRepository.findAllByAcademicYear_IdOrderBySortOrderAsc(5L)).thenReturn(List.of());
        when(academicYearMapper.toAcademicYearResponse(existingAcademicYear, List.of())).thenReturn(response);

        AcademicYearResponse result = academicYearService.patchAcademicYear(5L, request, "admin@example.com");

        assertThat(result).isSameAs(response);
        assertThat(existingAcademicYear.getCode()).isEqualTo("AY-2026-2027");
        assertThat(existingAcademicYear.getUpdatedBy()).isNull();

        verify(academicValidationService).validatePatchAcademicYear(
                existingAcademicYear,
                candidateAcademicYear
        );
        verify(academicYearMapper, never()).copyPatchableFields(any(), any());
        verify(academicYearRepository, never()).save(any());
        verify(entityManager, never()).flush();
        verify(entityManager, never()).clear();
    }

    private AcademicYear buildAcademicYear(Long id, String code) {
        AcademicYear academicYear = new AcademicYear();
        academicYear.setId(id);
        academicYear.setCode(code);
        academicYear.setName("Academic Year 2026-2027");
        academicYear.setStartDate(LocalDate.of(2026, 8, 1));
        academicYear.setEndDate(LocalDate.of(2027, 5, 31));
        academicYear.setActive(true);
        return academicYear;
    }
}
