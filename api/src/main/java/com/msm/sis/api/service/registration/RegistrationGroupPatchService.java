package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.PatchRegistrationGroupRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupDetailResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.SisUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;

import static com.msm.sis.api.patch.PatchUtils.apply;
import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
@RequiredArgsConstructor
public class RegistrationGroupPatchService {
    private final AcademicTermRepository academicTermRepository;
    private final AcademicYearRepository academicYearRepository;
    private final RegistrationGroupDetailService detailService;
    private final RegistrationGroupRepository registrationGroupRepository;
    private final SisUserRepository sisUserRepository;

    @Transactional
    public RegistrationGroupDetailResponse patchRegistrationGroup(
            Long registrationGroupId,
            PatchRegistrationGroupRequest request,
            Long actorUserId
    ) {
        PatchRegistrationGroupRequest requiredRequest = requireRequestBody(request);
        RegistrationGroup registrationGroup = registrationGroupRepository.findById(
                        requirePositiveId(registrationGroupId, "Registration group id")
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration group was not found."
                ));
        String originalStatus = normalizeExistingStatus(registrationGroup.getStatus());
        validateEditableStatus(originalStatus);

        applyTrimmed(requiredRequest.getName(), value -> {
            if (value == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required.");
            }
            validateMaxLength(value, 255, "Name");
            registrationGroup.setName(value);
        });
        apply(requiredRequest.getAcademicYearId(), academicYearId ->
                registrationGroup.setAcademicYear(resolveAcademicYear(academicYearId))
        );
        apply(requiredRequest.getTermId(), termId ->
                registrationGroup.setTerm(resolveTerm(termId))
        );
        apply(requiredRequest.getRegistrationOpensAt(), registrationGroup::setRegistrationOpensAt);
        apply(requiredRequest.getRegistrationClosesAt(), registrationGroup::setRegistrationClosesAt);
        applyTrimmed(requiredRequest.getStatus(), value ->
                registrationGroup.setStatus(normalizeStatus(value))
        );

        validateTermBelongsToYear(registrationGroup.getTerm(), registrationGroup.getAcademicYear());
        validateWindowForUpdate(registrationGroup, originalStatus);
        registrationGroup.setUpdatedByUser(resolveActorUser(actorUserId));
        registrationGroupRepository.save(registrationGroup);

        return detailService.getRegistrationGroupDetailWithoutLifecycleCleanup(registrationGroup.getId());
    }

    private AcademicYear resolveAcademicYear(Long academicYearId) {
        return academicYearRepository.findById(requirePositiveId(academicYearId, "Academic year id"))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic year was not found."
                ));
    }

    private AcademicTerm resolveTerm(Long termId) {
        return academicTermRepository.findDetailedById(requirePositiveId(termId, "Term id"))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Term was not found."
                ));
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = trimToNull(status);
        if (normalizedStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required.");
        }

        String upperStatus = normalizedStatus.toUpperCase(Locale.ROOT);
        if (!RegistrationGroupStatusSupport.isAllowedStatus(upperStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    RegistrationGroupStatusSupport.ALLOWED_STATUS_MESSAGE
            );
        }
        return upperStatus;
    }

    private void validateTermBelongsToYear(AcademicTerm term, AcademicYear academicYear) {
        if (term == null || academicYear == null || term.getAcademicYear() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year and term are required.");
        }
        if (!academicYear.getId().equals(term.getAcademicYear().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Term must belong to the selected academic year."
            );
        }
    }

    private void validateRegistrationWindowOrder(LocalDateTime opensAt, LocalDateTime closesAt) {
        if (opensAt != null && closesAt != null && !opensAt.isBefore(closesAt)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration opens at must be before registration closes at."
            );
        }
    }

    private void validateWindowForUpdate(RegistrationGroup registrationGroup, String originalStatus) {
        validateRegistrationWindowOrder(
                registrationGroup.getRegistrationOpensAt(),
                registrationGroup.getRegistrationClosesAt()
        );

        String currentStatus = normalizeExistingStatus(registrationGroup.getStatus());
        if (isPublishingTransition(originalStatus, currentStatus)) {
            validateRegistrationWindowForPublish(registrationGroup);
            return;
        }

        validateRegistrationWindowForEdit(registrationGroup);
    }

    private void validateEditableStatus(String originalStatus) {
        if (RegistrationGroupStatusSupport.CLOSED.equals(originalStatus)
                || RegistrationGroupStatusSupport.CANCELLED.equals(originalStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Closed and cancelled registration groups cannot be edited."
            );
        }
    }

    private boolean isPublishingTransition(String originalStatus, String currentStatus) {
        return RegistrationGroupStatusSupport.PUBLISHED.equals(currentStatus)
                && !RegistrationGroupStatusSupport.PUBLISHED.equals(originalStatus);
    }

    private void validateRegistrationWindowForPublish(RegistrationGroup registrationGroup) {
        LocalDateTime opensAt = registrationGroup.getRegistrationOpensAt();
        LocalDateTime closesAt = registrationGroup.getRegistrationClosesAt();
        LocalDateTime now = LocalDateTime.now();

        if (opensAt == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration open time is required before publishing."
            );
        }
        if (closesAt == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration close time is required before publishing."
            );
        }
        if (!opensAt.isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration open time must be in the future before publishing."
            );
        }
        if (!closesAt.isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration close time must be in the future before publishing."
            );
        }
    }

    private void validateRegistrationWindowForEdit(RegistrationGroup registrationGroup) {
        if (!RegistrationGroupStatusSupport.PUBLISHED.equals(normalizeExistingStatus(registrationGroup.getStatus()))) {
            return;
        }

        LocalDateTime opensAt = registrationGroup.getRegistrationOpensAt();
        LocalDateTime closesAt = registrationGroup.getRegistrationClosesAt();
        LocalDateTime now = LocalDateTime.now();

        if (opensAt == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration open time is required for published registration groups."
            );
        }
        if (closesAt == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration close time is required for published registration groups."
            );
        }
        if (!closesAt.isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration close time must be in the future for published registration groups."
            );
        }
    }

    private String normalizeExistingStatus(String status) {
        String trimmedStatus = trimToNull(status);
        return trimmedStatus == null ? null : trimmedStatus.toUpperCase(Locale.ROOT);
    }

    private SisUser resolveActorUser(Long actorUserId) {
        if (actorUserId == null) {
            return null;
        }

        return sisUserRepository.findById(actorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User was not found."));
    }
}
