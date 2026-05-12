package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupAssignedStudentResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupDetailCountsResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupDetailResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupDetailSummaryResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupRegistrationWindowResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupSavedSearchCriteriaResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AthleticSport;
import com.msm.sis.api.entity.ClassStanding;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupGeneration;
import com.msm.sis.api.entity.RegistrationGroupGenerationSport;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.RegistrationGroupGenerationSportRepository;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class RegistrationGroupDetailService {
    private final RegistrationGroupLifecycleService lifecycleService;
    private final RegistrationGroupRepository registrationGroupRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;
    private final RegistrationGroupGenerationSportRepository generationSportRepository;

    @Transactional(readOnly = true)
    public RegistrationGroupDetailResponse getRegistrationGroupDetail(Long registrationGroupId) {
        lifecycleService.closeExpiredPublishedGroups();
        return getRegistrationGroupDetailWithoutLifecycleCleanup(registrationGroupId);
    }

    @Transactional(readOnly = true)
    public RegistrationGroupDetailResponse getRegistrationGroupDetailWithoutLifecycleCleanup(Long registrationGroupId) {
        RegistrationGroup registrationGroup = registrationGroupRepository.findRegistrationGroupDetail(
                        requirePositiveId(registrationGroupId, "Registration group id")
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration group was not found."
                ));
        List<RegistrationGroupStudent> assignedStudents =
                registrationGroupStudentRepository.findAssignedStudentsForGroup(registrationGroup.getId());
        RegistrationGroupGeneration generation = registrationGroup.getRegistrationGroupGeneration();

        return new RegistrationGroupDetailResponse(
                toSummaryResponse(registrationGroup),
                new RegistrationGroupRegistrationWindowResponse(
                        registrationGroup.getRegistrationOpensAt(),
                        registrationGroup.getRegistrationClosesAt()
                ),
                toSavedSearchCriteriaResponse(generation),
                new RegistrationGroupDetailCountsResponse(
                        assignedStudents.size(),
                        generation == null ? null : generation.getMatchedStudentCount(),
                        generation == null ? null : generation.getSplitCount()
                ),
                assignedStudents.stream()
                        .map(this::toAssignedStudentResponse)
                        .toList()
        );
    }

    private RegistrationGroupDetailSummaryResponse toSummaryResponse(RegistrationGroup registrationGroup) {
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        RegistrationGroupGeneration generation = registrationGroup.getRegistrationGroupGeneration();
        String statusCode = normalizeStatusCode(registrationGroup.getStatus());

        return new RegistrationGroupDetailSummaryResponse(
                registrationGroup.getId(),
                registrationGroup.getName(),
                statusCode,
                toStatusName(statusCode),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                generation == null ? null : generation.getId(),
                generation == null ? null : generation.getName()
        );
    }

    private RegistrationGroupSavedSearchCriteriaResponse toSavedSearchCriteriaResponse(
            RegistrationGroupGeneration generation
    ) {
        if (generation == null) {
            return null;
        }

        AcademicYear academicYear = generation.getAcademicYear();
        AcademicTerm term = generation.getTerm();
        AcademicDivision academicDivision = generation.getAcademicDivision();

        return new RegistrationGroupSavedSearchCriteriaResponse(
                generation.getId(),
                generation.getName(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                term == null ? null : term.getId(),
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                generation.getStudentSearchText(),
                generation.getProgramSearchText(),
                generation.getGroupNamePrefix(),
                academicDivision == null
                        ? null
                        : new CodeNameReferenceOptionResponse(
                                academicDivision.getId(),
                                academicDivision.getCode(),
                                academicDivision.getName()
                        ),
                generation.getHonorsFilter(),
                generation.getAthleteFilter(),
                generation.getExistingGroupFilter(),
                generation.getMinCredits(),
                generation.getMaxCredits(),
                generation.isIncludeCurrentCredits(),
                generation.isIncludeTransferCredits(),
                generation.getSplitCount(),
                generation.getMatchedStudentCount(),
                generationSportRepository.findSportsForGeneration(generation.getId()).stream()
                        .map(RegistrationGroupGenerationSport::getAthleticSport)
                        .map(this::toAthleticSportOption)
                        .toList()
        );
    }

    private CodeNameReferenceOptionResponse toAthleticSportOption(AthleticSport athleticSport) {
        return new CodeNameReferenceOptionResponse(
                athleticSport.getId(),
                athleticSport.getCode(),
                athleticSport.getName()
        );
    }

    private RegistrationGroupAssignedStudentResponse toAssignedStudentResponse(
            RegistrationGroupStudent registrationGroupStudent
    ) {
        Student student = registrationGroupStudent.getStudent();
        ClassStanding classStanding = student == null ? null : student.getClassStanding();

        return new RegistrationGroupAssignedStudentResponse(
                registrationGroupStudent.getId(),
                student == null ? null : student.getId(),
                student == null ? null : student.getAltId(),
                student == null ? null : student.getFirstName(),
                student == null ? null : student.getLastName(),
                buildDisplayName(student),
                student == null ? null : student.getEmail(),
                classStanding == null ? null : classStanding.getId(),
                classStanding == null ? null : classStanding.getName(),
                student == null ? null : student.getEstimatedGradDate(),
                registrationGroupStudent.getAssignmentSource(),
                registrationGroupStudent.getCreatedAt(),
                registrationGroupStudent.getUpdatedAt()
        );
    }

    private String buildDisplayName(Student student) {
        if (student == null) {
            return null;
        }

        String preferredName = trimToNull(student.getPreferredName());
        String firstName = preferredName == null ? trimToNull(student.getFirstName()) : preferredName;
        String lastName = trimToNull(student.getLastName());
        String displayName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        if (!displayName.isBlank()) {
            return displayName;
        }

        String email = trimToNull(student.getEmail());
        return email == null ? student.getAltId() : email;
    }

    private String normalizeStatusCode(String status) {
        String trimmedStatus = trimToNull(status);
        return trimmedStatus == null ? null : trimmedStatus.toUpperCase(Locale.ROOT);
    }

    private String toStatusName(String status) {
        return RegistrationGroupStatusSupport.statusName(status);
    }
}
