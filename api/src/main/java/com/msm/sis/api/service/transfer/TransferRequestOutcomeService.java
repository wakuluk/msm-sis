package com.msm.sis.api.service.transfer;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.transfer.TransferRequestOutcomeRequest;
import com.msm.sis.api.dto.transfer.TransferRequestOutcomeResponse;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.TransferCourseEquivalency;
import com.msm.sis.api.entity.TransferCourseEquivalencyOutcome;
import com.msm.sis.api.entity.TransferRequestCourse;
import com.msm.sis.api.entity.TransferRequestOutcome;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.ProgramVersionRequirementRepository;
import com.msm.sis.api.repository.RequirementRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.TransferCourseEquivalencyOutcomeRepository;
import com.msm.sis.api.repository.TransferCourseEquivalencyRepository;
import com.msm.sis.api.repository.TransferRequestCourseRepository;
import com.msm.sis.api.repository.TransferRequestOutcomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class TransferRequestOutcomeService {

    private static final String OUTCOME_TRANSFER_CREDIT = "TRANSFER_CREDIT";
    private static final String OUTCOME_COURSE_SUBSTITUTION = "COURSE_SUBSTITUTION";
    private static final String OUTCOME_REQUIREMENT_WAIVER = "REQUIREMENT_WAIVER";

    private static final Set<String> ALLOWED_OUTCOME_TYPES = Set.of(
            OUTCOME_TRANSFER_CREDIT,
            OUTCOME_COURSE_SUBSTITUTION,
            OUTCOME_REQUIREMENT_WAIVER
    );

    private final CourseRepository courseRepository;
    private final ProgramVersionRequirementRepository programVersionRequirementRepository;
    private final RequirementRepository requirementRepository;
    private final SisUserRepository sisUserRepository;
    private final TransferCourseEquivalencyOutcomeRepository transferCourseEquivalencyOutcomeRepository;
    private final TransferCourseEquivalencyRepository transferCourseEquivalencyRepository;
    private final TransferRequestCourseRepository transferRequestCourseRepository;
    private final TransferRequestOutcomeRepository transferRequestOutcomeRepository;

    @Transactional(readOnly = true)
    public List<TransferRequestOutcomeResponse> listOutcomes(Long transferRequestCourseId) {
        requirePositiveId(transferRequestCourseId, "Transfer request course id");

        return transferRequestOutcomeRepository.findByTransferRequestCourseIdOrderByIdAsc(transferRequestCourseId)
                .stream()
                .map(this::mapOutcomeResponse)
                .toList();
    }

    @Transactional
    public TransferRequestOutcomeResponse createOutcome(
            Long transferRequestCourseId,
            TransferRequestOutcomeRequest request,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestCourseId, "Transfer request course id");
        requireRequestBody(request);

        TransferRequestCourse transferRequestCourse = transferRequestCourseRepository.findById(transferRequestCourseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer request course was not found."
                ));

        TransferRequestOutcome outcome = new TransferRequestOutcome();
        outcome.setTransferRequestCourse(transferRequestCourse);
        applyOutcomeValues(outcome, request, jwt);

        return mapOutcomeResponse(transferRequestOutcomeRepository.save(outcome));
    }

    @Transactional
    public List<TransferRequestOutcomeResponse> createOutcomesFromEquivalency(
            Long transferRequestCourseId,
            Long transferCourseEquivalencyId,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestCourseId, "Transfer request course id");
        requirePositiveId(transferCourseEquivalencyId, "Transfer course equivalency id");

        TransferRequestCourse transferRequestCourse = transferRequestCourseRepository.findById(transferRequestCourseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer request course was not found."
                ));
        TransferCourseEquivalency equivalency = transferCourseEquivalencyRepository
                .findById(transferCourseEquivalencyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer course equivalency was not found."
                ));
        List<TransferCourseEquivalencyOutcome> savedOutcomes = transferCourseEquivalencyOutcomeRepository
                .findByEquivalencyIdOrderBySortOrderAscIdAsc(equivalency.getId());

        if (savedOutcomes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Transfer course equivalency does not have saved outcomes."
            );
        }

        SisUser currentUser = findCurrentUser(jwt);
        LocalDateTime approvedAt = LocalDateTime.now();
        List<TransferRequestOutcome> requestOutcomes = savedOutcomes.stream()
                .map(savedOutcome -> buildRequestOutcomeFromSavedOutcome(
                        transferRequestCourse,
                        savedOutcome,
                        currentUser,
                        approvedAt
                ))
                .toList();

        return transferRequestOutcomeRepository.saveAll(requestOutcomes)
                .stream()
                .map(this::mapOutcomeResponse)
                .toList();
    }

    @Transactional
    public TransferRequestOutcomeResponse updateOutcome(
            Long transferRequestOutcomeId,
            TransferRequestOutcomeRequest request,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestOutcomeId, "Transfer request outcome id");
        requireRequestBody(request);

        TransferRequestOutcome outcome = transferRequestOutcomeRepository.findById(transferRequestOutcomeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer request outcome was not found."
                ));
        applyOutcomeValues(outcome, request, jwt);

        return mapOutcomeResponse(transferRequestOutcomeRepository.save(outcome));
    }

    @Transactional
    public void deleteOutcome(Long transferRequestOutcomeId) {
        requirePositiveId(transferRequestOutcomeId, "Transfer request outcome id");

        TransferRequestOutcome outcome = transferRequestOutcomeRepository.findById(transferRequestOutcomeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer request outcome was not found."
                ));

        transferRequestOutcomeRepository.delete(outcome);
    }

    private void applyOutcomeValues(
            TransferRequestOutcome outcome,
            TransferRequestOutcomeRequest request,
            AuthenticatedJwt jwt
    ) {
        String outcomeType = normalizeOutcomeType(request.outcomeType());
        Course localCourse = resolveLocalCourse(request.localCourseId());
        Requirement requirement = resolveRequirement(request.requirementId());
        ProgramVersionRequirement programVersionRequirement = resolveProgramVersionRequirement(
                request.programVersionRequirementId()
        );

        validateOutcomeShape(outcomeType, localCourse, requirement, programVersionRequirement);

        if (programVersionRequirement != null && requirement != null
                && !programVersionRequirement.getRequirement().getId().equals(requirement.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Program version requirement does not match the supplied requirement."
            );
        }

        outcome.setOutcomeType(outcomeType);
        outcome.setLocalCourse(localCourse);
        outcome.setRequirement(requirement);
        outcome.setProgramVersionRequirement(programVersionRequirement);
        outcome.setAcceptedCredits(request.acceptedCredits());
        outcome.setNotes(trimToNull(request.notes()));
        outcome.setApprovedByUser(findCurrentUser(jwt));
        outcome.setApprovedAt(LocalDateTime.now());
    }

    private TransferRequestOutcome buildRequestOutcomeFromSavedOutcome(
            TransferRequestCourse transferRequestCourse,
            TransferCourseEquivalencyOutcome savedOutcome,
            SisUser approvedByUser,
            LocalDateTime approvedAt
    ) {
        validateOutcomeShape(
                savedOutcome.getOutcomeType(),
                savedOutcome.getLocalCourse(),
                savedOutcome.getRequirement(),
                savedOutcome.getProgramVersionRequirement()
        );

        TransferRequestOutcome requestOutcome = new TransferRequestOutcome();
        requestOutcome.setTransferRequestCourse(transferRequestCourse);
        requestOutcome.setOutcomeType(savedOutcome.getOutcomeType());
        requestOutcome.setLocalCourse(savedOutcome.getLocalCourse());
        requestOutcome.setRequirement(savedOutcome.getRequirement());
        requestOutcome.setProgramVersionRequirement(savedOutcome.getProgramVersionRequirement());
        requestOutcome.setAcceptedCredits(savedOutcome.getAcceptedCredits());
        requestOutcome.setNotes(savedOutcome.getNotes());
        requestOutcome.setApprovedByUser(approvedByUser);
        requestOutcome.setApprovedAt(approvedAt);
        return requestOutcome;
    }

    private void validateOutcomeShape(
            String outcomeType,
            Course localCourse,
            Requirement requirement,
            ProgramVersionRequirement programVersionRequirement
    ) {
        if (OUTCOME_COURSE_SUBSTITUTION.equals(outcomeType) && localCourse == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course substitution outcomes require a local course."
            );
        }

        if (OUTCOME_REQUIREMENT_WAIVER.equals(outcomeType)
                && requirement == null
                && programVersionRequirement == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requirement waiver outcomes require a requirement or program version requirement."
            );
        }
    }

    private Course resolveLocalCourse(Long localCourseId) {
        if (localCourseId == null) {
            return null;
        }

        requirePositiveId(localCourseId, "Local course id");
        return courseRepository.findById(localCourseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Local course was not found."));
    }

    private Requirement resolveRequirement(Long requirementId) {
        if (requirementId == null) {
            return null;
        }

        requirePositiveId(requirementId, "Requirement id");
        return requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement was not found."));
    }

    private ProgramVersionRequirement resolveProgramVersionRequirement(Long programVersionRequirementId) {
        if (programVersionRequirementId == null) {
            return null;
        }

        requirePositiveId(programVersionRequirementId, "Program version requirement id");
        return programVersionRequirementRepository.findById(programVersionRequirementId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Program version requirement was not found."
                ));
    }

    private SisUser findCurrentUser(AuthenticatedJwt jwt) {
        return sisUserRepository.findById(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user was not found."));
    }

    private String normalizeOutcomeType(String outcomeType) {
        String normalizedOutcomeType = trimToNull(outcomeType);
        if (normalizedOutcomeType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Outcome type is required.");
        }

        normalizedOutcomeType = normalizedOutcomeType.toUpperCase().replace('-', '_').replace(' ', '_');
        if (!ALLOWED_OUTCOME_TYPES.contains(normalizedOutcomeType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Outcome type is invalid.");
        }

        return normalizedOutcomeType;
    }

    private TransferRequestOutcomeResponse mapOutcomeResponse(TransferRequestOutcome outcome) {
        Course localCourse = outcome.getLocalCourse();
        Requirement effectiveRequirement = outcome.getRequirement() == null && outcome.getProgramVersionRequirement() != null
                ? outcome.getProgramVersionRequirement().getRequirement()
                : outcome.getRequirement();
        SisUser approvedByUser = outcome.getApprovedByUser();

        return new TransferRequestOutcomeResponse(
                outcome.getId(),
                outcome.getTransferRequestCourse().getId(),
                outcome.getOutcomeType(),
                localCourse == null ? null : localCourse.getId(),
                localCourse == null ? null : localCourse.getSubject().getCode() + " " + localCourse.getCourseNumber(),
                effectiveRequirement == null ? null : effectiveRequirement.getId(),
                effectiveRequirement == null ? null : effectiveRequirement.getCode(),
                effectiveRequirement == null ? null : effectiveRequirement.getName(),
                outcome.getProgramVersionRequirement() == null ? null : outcome.getProgramVersionRequirement().getId(),
                outcome.getAcceptedCredits(),
                outcome.getNotes(),
                approvedByUser.getId(),
                approvedByUser.getEmail(),
                outcome.getApprovedAt(),
                outcome.getCreatedAt(),
                outcome.getUpdatedAt()
        );
    }
}
