package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.AcademicSubTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicSubTermRequest;
import com.msm.sis.api.dto.academic.year.PatchAcademicYearRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicSubTermRequest;
import com.msm.sis.api.dto.academic.year.AcademicYearResponse;
import com.msm.sis.api.dto.academic.year.AcademicYearSearchResponse;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearSubTermRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicSubTermStatus;
import com.msm.sis.api.patch.PatchValue;
import org.springframework.stereotype.Component;

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

    public AcademicSubTerm fromCreateAcademicSubTermRequest(
            AcademicYear academicYear,
            AcademicSubTermStatus subTermStatus,
            CreateAcademicSubTermRequest request
    ) {
        AcademicSubTerm subTerm = new AcademicSubTerm();
        subTerm.setAcademicYear(academicYear);
        subTerm.setCode(trimToNull(request.code()));
        subTerm.setName(trimToNull(request.name()));
        subTerm.setStartDate(request.startDate());
        subTerm.setEndDate(request.endDate());
        subTerm.setSortOrder(request.sortOrder());
        subTerm.setStatus(subTermStatus);
        subTerm.setActive(true);
        return subTerm;
    }

    public AcademicSubTerm fromCreateAcademicYearSubTermRequest(
            AcademicYear academicYear,
            AcademicSubTermStatus subTermStatus,
            CreateAcademicYearSubTermRequest request
    ) {
        AcademicSubTerm subTerm = new AcademicSubTerm();
        subTerm.setAcademicYear(academicYear);
        subTerm.setCode(trimToNull(request.code()));
        subTerm.setName(trimToNull(request.name()));
        subTerm.setStartDate(request.startDate());
        subTerm.setEndDate(request.endDate());
        subTerm.setSortOrder(request.sortOrder());
        subTerm.setStatus(subTermStatus);
        subTerm.setActive(true);
        return subTerm;
    }

    public AcademicSubTermResponse toAcademicSubTermResponse(AcademicSubTerm subTerm) {
        return toAcademicSubTermResponse(subTerm, 0L);
    }

    public AcademicSubTermResponse toAcademicSubTermResponse(
            AcademicSubTerm subTerm,
            long courseOfferingCount
    ) {
        return new AcademicSubTermResponse(
                subTerm.getId(),
                subTerm.getAcademicYear() == null ? null : subTerm.getAcademicYear().getId(),
                subTerm.getCode(),
                subTerm.getName(),
                subTerm.getStartDate(),
                subTerm.getEndDate(),
                subTerm.getSortOrder(),
                subTerm.getStatus() == null ? null : subTerm.getStatus().getCode(),
                subTerm.getStatus() == null ? null : subTerm.getStatus().getName(),
                subTerm.isActive(),
                courseOfferingCount,
                subTerm.getLastUpdated(),
                subTerm.getUpdatedBy()
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

    public AcademicYearResponse toAcademicYearResponse(
            AcademicYear academicYear,
            List<AcademicSubTermResponse> subTerms,
            List<AcademicTermResponse> terms
    ) {
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
                subTerms == null ? List.of() : subTerms,
                terms == null ? List.of() : terms
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

    public void applyPatch(AcademicSubTerm academicSubTerm, PatchAcademicSubTermRequest request) {
        applyTrimmed(request.getCode(), academicSubTerm::setCode);
        applyTrimmed(request.getName(), academicSubTerm::setName);
        applyDirect(request.getStartDate(), academicSubTerm::setStartDate);
        applyDirect(request.getEndDate(), academicSubTerm::setEndDate);
        applyDirect(request.getSortOrder(), academicSubTerm::setSortOrder);
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
