package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.PatchAcademicYearRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.AcademicYearResponse;
import com.msm.sis.api.dto.academic.year.AcademicYearSearchResponse;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermStatus;
import com.msm.sis.api.patch.PatchValue;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.function.Consumer;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class AcademicYearMapper {

    public AcademicYear fromCreateAcademicYearRequest(CreateAcademicYearRequest request) {
        AcademicYear academicYear = new AcademicYear();
        academicYear.setCode(trimToNull(request.code()));
        academicYear.setName(trimToNull(request.name()));
        academicYear.setStartDate(request.startDate());
        academicYear.setEndDate(request.endDate());
        academicYear.setActive(false);
        academicYear.setPublished(false);
        return academicYear;
    }

    public AcademicTerm fromCreateAcademicTermRequest(
            AcademicYear academicYear,
            AcademicTermStatus termStatus,
            CreateAcademicTermRequest request
    ) {
        AcademicTerm term = new AcademicTerm();
        term.setAcademicYear(academicYear);
        term.setCode(trimToNull(request.code()));
        term.setName(trimToNull(request.name()));
        term.setStartDate(request.startDate());
        term.setEndDate(request.endDate());
        term.setSortOrder(request.sortOrder());
        term.setStatus(termStatus);
        term.setActive(true);
        return term;
    }

    public AcademicTerm fromCreateAcademicYearTermRequest(
            AcademicYear academicYear,
            AcademicTermStatus termStatus,
            CreateAcademicYearTermRequest request
    ) {
        AcademicTerm term = new AcademicTerm();
        term.setAcademicYear(academicYear);
        term.setCode(trimToNull(request.code()));
        term.setName(trimToNull(request.name()));
        term.setStartDate(request.startDate());
        term.setEndDate(request.endDate());
        term.setSortOrder(request.sortOrder());
        term.setStatus(termStatus);
        term.setActive(true);
        return term;
    }

    public AcademicTermResponse toAcademicTermResponse(AcademicTerm term) {
        return new AcademicTermResponse(
                term.getId(),
                term.getAcademicYear() == null ? null : term.getAcademicYear().getId(),
                term.getCode(),
                term.getName(),
                term.getStartDate(),
                term.getEndDate(),
                term.getSortOrder(),
                term.getStatus() == null ? null : term.getStatus().getCode(),
                term.getStatus() == null ? null : term.getStatus().getName(),
                term.isActive(),
                term.getLastUpdated(),
                term.getUpdatedBy()
        );
    }

    public AcademicYearSearchResponse toAcademicYearSearchResponse(AcademicYear academicYear) {
        return new AcademicYearSearchResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                academicYear.getStartDate(),
                academicYear.getEndDate(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getCode(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getName(),
                academicYear.isActive(),
                academicYear.isPublished()
        );
    }

    public AcademicYearResponse toAcademicYearResponse(AcademicYear academicYear, List<AcademicTerm> terms) {
        List<AcademicTermResponse> termResponses = terms == null
                ? List.of()
                : terms.stream()
                .sorted(Comparator.comparing(AcademicTerm::getSortOrder))
                .map(this::toAcademicTermResponse)
                .toList();

        return new AcademicYearResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                academicYear.getStartDate(),
                academicYear.getEndDate(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getId(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getCode(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getName(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getSortOrder(),
                academicYear.isActive(),
                academicYear.isPublished(),
                academicYear.getLastUpdated(),
                academicYear.getUpdatedBy(),
                termResponses
        );
    }

    public AcademicYearResponse toAcademicYearResponseFromTermResponses(
            AcademicYear academicYear,
            List<AcademicTermResponse> terms
    ) {
        List<AcademicTermResponse> termResponses = terms == null
                ? List.of()
                : terms.stream()
                .sorted(Comparator.comparing(AcademicTermResponse::sortOrder))
                .toList();

        return new AcademicYearResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                academicYear.getStartDate(),
                academicYear.getEndDate(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getId(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getCode(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getName(),
                academicYear.getStatus() == null ? null : academicYear.getStatus().getSortOrder(),
                academicYear.isActive(),
                academicYear.isPublished(),
                academicYear.getLastUpdated(),
                academicYear.getUpdatedBy(),
                termResponses
        );
    }

    public AcademicYear copy(AcademicYear academicYear) {
        AcademicYear copy = new AcademicYear();
        copy.setId(academicYear.getId());
        copy.setCode(academicYear.getCode());
        copy.setName(academicYear.getName());
        copy.setStartDate(academicYear.getStartDate());
        copy.setEndDate(academicYear.getEndDate());
        copy.setStatus(academicYear.getStatus());
        copy.setActive(academicYear.isActive());
        copy.setPublished(academicYear.isPublished());
        copy.setLastUpdated(academicYear.getLastUpdated());
        copy.setUpdatedBy(academicYear.getUpdatedBy());
        return copy;
    }

    public void copyPatchableFields(AcademicYear source, AcademicYear target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setStartDate(source.getStartDate());
        target.setEndDate(source.getEndDate());
    }

    public void applyPatch(AcademicYear academicYear, PatchAcademicYearRequest request) {
        applyTrimmed(request.getCode(), academicYear::setCode);
        applyTrimmed(request.getName(), academicYear::setName);
        applyDirect(request.getStartDate(), academicYear::setStartDate);
        applyDirect(request.getEndDate(), academicYear::setEndDate);
    }

    public void applyPatch(AcademicTerm academicTerm, PatchAcademicTermRequest request) {
        applyTrimmed(request.getCode(), academicTerm::setCode);
        applyTrimmed(request.getName(), academicTerm::setName);
        applyDirect(request.getStartDate(), academicTerm::setStartDate);
        applyDirect(request.getEndDate(), academicTerm::setEndDate);
        applyDirect(request.getSortOrder(), academicTerm::setSortOrder);
    }

    private <T> void applyDirect(PatchValue<T> value, Consumer<T> consumer) {
        if (value.isPresent()) {
            consumer.accept(value.orElse(null));
        }
    }

    private void applyTrimmed(PatchValue<String> value, Consumer<String> consumer) {
        if (value.isPresent()) {
            consumer.accept(trimToNull(value.orElse(null)));
        }
    }
}
