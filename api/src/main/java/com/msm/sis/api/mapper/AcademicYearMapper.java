package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.AcademicYearResponse;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermStatus;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

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
                term.isActive()
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
                academicYear.isActive(),
                academicYear.isPublished(),
                termResponses
        );
    }
}
