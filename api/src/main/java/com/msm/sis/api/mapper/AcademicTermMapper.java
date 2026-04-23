package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.AcademicSubTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermRequest;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.patch.PatchValue;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class AcademicTermMapper {

    private final AcademicYearMapper academicYearMapper;

    public AcademicTermMapper(AcademicYearMapper academicYearMapper) {
        this.academicYearMapper = academicYearMapper;
    }

    public AcademicTerm fromCreateAcademicTermRequest(
            AcademicYear academicYear,
            CreateAcademicTermRequest request
    ) {
        AcademicTerm academicTerm = new AcademicTerm();
        academicTerm.setAcademicYear(academicYear);
        academicTerm.setCode(trimToNull(request.code()));
        academicTerm.setName(trimToNull(request.name()));
        academicTerm.setStartDate(request.startDate());
        academicTerm.setEndDate(request.endDate());
        return academicTerm;
    }

    public AcademicTermResponse toAcademicTermResponse(AcademicTerm academicTerm) {
        return toAcademicTermResponse(academicTerm, Map.of());
    }

    public AcademicTermResponse toAcademicTermResponse(
            AcademicTerm academicTerm,
            Map<Long, Long> courseOfferingCountsBySubTermId
    ) {
        AcademicTermResponse response = new AcademicTermResponse();
        response.setTermId(academicTerm.getId());
        response.setAcademicYearId(
                academicTerm.getAcademicYear() == null ? null : academicTerm.getAcademicYear().getId()
        );
        response.setCode(academicTerm.getCode());
        response.setName(academicTerm.getName());
        response.setStartDate(academicTerm.getStartDate());
        response.setEndDate(academicTerm.getEndDate());
        response.setSubTerms(
                toAcademicSubTermResponses(academicTerm.getAcademicSubTerms(), courseOfferingCountsBySubTermId)
        );
        return response;
    }

    public AcademicTerm copy(AcademicTerm academicTerm) {
        AcademicTerm copy = new AcademicTerm();
        copy.setId(academicTerm.getId());
        copy.setAcademicYear(academicTerm.getAcademicYear());
        copy.setCode(academicTerm.getCode());
        copy.setName(academicTerm.getName());
        copy.setStartDate(academicTerm.getStartDate());
        copy.setEndDate(academicTerm.getEndDate());
        copy.getAcademicSubTerms().addAll(academicTerm.getAcademicSubTerms());
        return copy;
    }

    public void copyPatchableFields(AcademicTerm source, AcademicTerm target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setStartDate(source.getStartDate());
        target.setEndDate(source.getEndDate());
    }

    public void applyPatch(AcademicTerm academicTerm, PatchAcademicTermRequest request) {
        applyTrimmed(request.getCode(), academicTerm::setCode);
        applyTrimmed(request.getName(), academicTerm::setName);
        applyDirect(request.getStartDate(), academicTerm::setStartDate);
        applyDirect(request.getEndDate(), academicTerm::setEndDate);
    }

    private List<AcademicSubTermResponse> toAcademicSubTermResponses(
            List<AcademicSubTerm> academicSubTerms,
            Map<Long, Long> courseOfferingCountsBySubTermId
    ) {
        if (academicSubTerms == null) {
            return List.of();
        }

        return academicSubTerms.stream()
                .sorted(Comparator.comparing(AcademicSubTerm::getSortOrder))
                .map(subTerm -> academicYearMapper.toAcademicSubTermResponse(
                        subTerm,
                        courseOfferingCountsBySubTermId.getOrDefault(subTerm.getId(), 0L)
                ))
                .toList();
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
