package com.msm.sis.api.dto.billing;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PatchBillingPeriodRequest {
    private PatchValue<String> name = PatchValue.absent();
    private PatchValue<String> description = PatchValue.absent();
    private PatchValue<String> type = PatchValue.absent();
    private PatchValue<String> status = PatchValue.absent();
    private PatchValue<Long> academicYearId = PatchValue.absent();
    private PatchValue<Long> termId = PatchValue.absent();
    private PatchValue<LocalDate> startDate = PatchValue.absent();
    private PatchValue<LocalDate> endDate = PatchValue.absent();
    private PatchValue<LocalDate> actualStartPreliminaryEndDate = PatchValue.absent();
    private PatchValue<String> taxAcademicYear = PatchValue.absent();
    private PatchValue<String> taxAcademicYearLabel = PatchValue.absent();
    private PatchValue<String> taxAcademicTermCode = PatchValue.absent();
    private PatchValue<String> taxAcademicTermName = PatchValue.absent();
    private PatchValue<String> financialAidPeriodCode = PatchValue.absent();
    private PatchValue<String> financialAidPeriodName = PatchValue.absent();
    private PatchValue<String> courseBillingBasis = PatchValue.absent();
    private PatchValue<String> nonCourseBillingBasis = PatchValue.absent();
    private PatchValue<Integer> actualFromToDays = PatchValue.absent();
    private PatchValue<Integer> preliminaryFromToDays = PatchValue.absent();
    private PatchValue<Boolean> active = PatchValue.absent();
    private PatchValue<Boolean> allowReBilling = PatchValue.absent();
    private PatchValue<Boolean> allowArBilling = PatchValue.absent();
    private PatchValue<Boolean> includeInArStatements = PatchValue.absent();
    private PatchValue<Boolean> allowBillingInCampusPortal = PatchValue.absent();
    private PatchValue<Boolean> runPrelimInCampusPortalOnly = PatchValue.absent();
    private PatchValue<Boolean> academicRecordsMapped = PatchValue.absent();
    private PatchValue<Boolean> childrenAssigned = PatchValue.absent();
}
