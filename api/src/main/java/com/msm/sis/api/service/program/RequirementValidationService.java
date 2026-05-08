package com.msm.sis.api.service.program;

import com.msm.sis.api.dto.program.CreateRequirementRequest;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.repository.ProgramVersionRequirementRepository;
import com.msm.sis.api.repository.RequirementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class RequirementValidationService {
    private final ProgramVersionRequirementRepository programVersionRequirementRepository;
    private final RequirementRepository requirementRepository;

    public void validatePageRequest(int page, int size) {
        com.msm.sis.api.util.PagingUtils.validatePageRequest(page, size, 100);
    }

    public void validateCreateRequirementRequest(CreateRequirementRequest request) {
        requireRequestBody(request);

        if (trimToNull(request.code()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement code is required.");
        }

        if (trimToNull(request.name()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement name is required.");
        }
    }

    public void validateRequirementCodeAvailable(String code) {
        if (requirementRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A requirement with this code already exists.");
        }
    }

    public void validateRequirementCodeAvailableForPatch(Requirement requirement, String code) {
        requirementRepository.findByCode(code)
                .filter(existingRequirement -> !Objects.equals(existingRequirement.getId(), requirement.getId()))
                .ifPresent(existingRequirement -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "A requirement with this code already exists."
                    );
                });
    }

    public void validateRequirementAssignmentAvailable(Long programVersionId, Long requirementId) {
        if (programVersionRequirementRepository.hasRequirement(programVersionId, requirementId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This requirement is already attached to the selected program version."
            );
        }
    }
}
