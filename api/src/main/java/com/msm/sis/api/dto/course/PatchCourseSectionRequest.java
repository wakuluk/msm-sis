package com.msm.sis.api.dto.course;

import com.msm.sis.api.patch.PatchValue;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PatchCourseSectionRequest {
    private PatchValue<Long> subTermId = PatchValue.absent();
    private PatchValue<String> sectionLetter = PatchValue.absent();
    private PatchValue<String> title = PatchValue.absent();
    private PatchValue<Boolean> honors = PatchValue.absent();
    private PatchValue<String> statusCode = PatchValue.absent();
    private PatchValue<String> academicDivisionCode = PatchValue.absent();
    private PatchValue<String> deliveryModeCode = PatchValue.absent();
    private PatchValue<String> gradingBasisCode = PatchValue.absent();
    private PatchValue<BigDecimal> credits = PatchValue.absent();
    private PatchValue<Integer> capacity = PatchValue.absent();
    private PatchValue<Integer> hardCapacity = PatchValue.absent();
    private PatchValue<Boolean> waitlistAllowed = PatchValue.absent();
    private PatchValue<LocalDate> startDate = PatchValue.absent();
    private PatchValue<LocalDate> endDate = PatchValue.absent();
    private PatchValue<String> linkedGroupCode = PatchValue.absent();
    private PatchValue<String> notes = PatchValue.absent();
    private PatchValue<List<CreateCourseSectionInstructorRequest>> instructors = PatchValue.absent();
    private PatchValue<List<CreateCourseSectionMeetingRequest>> meetings = PatchValue.absent();
}
