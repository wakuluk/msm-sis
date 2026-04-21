package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.term.AcademicTermGroupResponse;
import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermGroupRequest;
import com.msm.sis.api.dto.academic.term.PatchAcademicTermGroupRequest;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermGroup;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.patch.PatchValue;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class AcademicTermGroupMapper {

    private final AcademicYearMapper academicYearMapper;

    public AcademicTermGroupMapper(AcademicYearMapper academicYearMapper) {
        this.academicYearMapper = academicYearMapper;
    }

    public AcademicTermGroup fromCreateAcademicTermGroupRequest(
            AcademicYear academicYear,
            CreateAcademicTermGroupRequest request
    ) {
        AcademicTermGroup academicTermGroup = new AcademicTermGroup();
        academicTermGroup.setAcademicYear(academicYear);
        academicTermGroup.setCode(trimToNull(request.code()));
        academicTermGroup.setName(trimToNull(request.name()));
        academicTermGroup.setStartDate(request.startDate());
        academicTermGroup.setEndDate(request.endDate());
        return academicTermGroup;
    }

    public AcademicTermGroupResponse toAcademicTermGroupResponse(AcademicTermGroup academicTermGroup) {
        return toAcademicTermGroupResponse(academicTermGroup, Map.of());
    }

    public AcademicTermGroupResponse toAcademicTermGroupResponse(
            AcademicTermGroup academicTermGroup,
            Map<Long, Long> courseOfferingCountsByTermId
    ) {
        AcademicTermGroupResponse response = new AcademicTermGroupResponse();
        response.setTermGroupId(academicTermGroup.getId());
        response.setAcademicYearId(
                academicTermGroup.getAcademicYear() == null ? null : academicTermGroup.getAcademicYear().getId()
        );
        response.setCode(academicTermGroup.getCode());
        response.setName(academicTermGroup.getName());
        response.setStartDate(academicTermGroup.getStartDate());
        response.setEndDate(academicTermGroup.getEndDate());
        response.setAcademicTerms(
                toAcademicTermResponses(academicTermGroup.getAcademicTerms(), courseOfferingCountsByTermId)
        );
        return response;
    }

    public AcademicTermGroup copy(AcademicTermGroup academicTermGroup) {
        AcademicTermGroup copy = new AcademicTermGroup();
        copy.setId(academicTermGroup.getId());
        copy.setAcademicYear(academicTermGroup.getAcademicYear());
        copy.setCode(academicTermGroup.getCode());
        copy.setName(academicTermGroup.getName());
        copy.setStartDate(academicTermGroup.getStartDate());
        copy.setEndDate(academicTermGroup.getEndDate());
        copy.getAcademicTerms().addAll(academicTermGroup.getAcademicTerms());
        return copy;
    }

    public void copyPatchableFields(AcademicTermGroup source, AcademicTermGroup target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setStartDate(source.getStartDate());
        target.setEndDate(source.getEndDate());
    }

    public void applyPatch(AcademicTermGroup academicTermGroup, PatchAcademicTermGroupRequest request) {
        applyTrimmed(request.getCode(), academicTermGroup::setCode);
        applyTrimmed(request.getName(), academicTermGroup::setName);
        applyDirect(request.getStartDate(), academicTermGroup::setStartDate);
        applyDirect(request.getEndDate(), academicTermGroup::setEndDate);
    }

    private List<AcademicTermResponse> toAcademicTermResponses(
            List<AcademicTerm> academicTerms,
            Map<Long, Long> courseOfferingCountsByTermId
    ) {
        if (academicTerms == null) {
            return List.of();
        }

        return academicTerms.stream()
                .sorted(Comparator.comparing(AcademicTerm::getSortOrder))
                .map(term -> academicYearMapper.toAcademicTermResponse(
                        term,
                        courseOfferingCountsByTermId.getOrDefault(term.getId(), 0L)
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
