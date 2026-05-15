package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.repository.TransferRequestOutcomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentRequirementWaiverService {

    private final TransferRequestOutcomeRepository transferRequestOutcomeRepository;

    @Transactional(readOnly = true)
    public StudentRequirementWaiverLookup findApprovedRequirementWaivers(Long studentId) {
        requirePositiveId(studentId, "Student id");

        Map<Long, StudentRequirementWaiver> waiversByProgramVersionRequirementId = new LinkedHashMap<>();
        Map<Long, StudentRequirementWaiver> waiversByRequirementId = new LinkedHashMap<>();

        transferRequestOutcomeRepository.findApprovedRequirementWaiversForStudent(studentId)
                .stream()
                .map(this::mapWaiver)
                .forEach(waiver -> {
                    if (waiver.programVersionRequirementId() != null) {
                        waiversByProgramVersionRequirementId.putIfAbsent(
                                waiver.programVersionRequirementId(),
                                waiver
                        );
                    }
                    if (waiver.requirementId() != null) {
                        waiversByRequirementId.putIfAbsent(waiver.requirementId(), waiver);
                    }
                });

        return new StudentRequirementWaiverLookup(
                Map.copyOf(waiversByProgramVersionRequirementId),
                Map.copyOf(waiversByRequirementId)
        );
    }

    private StudentRequirementWaiver mapWaiver(
            TransferRequestOutcomeRepository.ApprovedRequirementWaiverProjection projection
    ) {
        return new StudentRequirementWaiver(
                projection.getTransferRequestOutcomeId(),
                projection.getRequirementId(),
                projection.getProgramVersionRequirementId(),
                projection.getAcceptedCredits(),
                projection.getNotes(),
                projection.getApprovedAt()
        );
    }

    public record StudentRequirementWaiverLookup(
            Map<Long, StudentRequirementWaiver> waiversByProgramVersionRequirementId,
            Map<Long, StudentRequirementWaiver> waiversByRequirementId
    ) {
        public StudentRequirementWaiver findFor(ProgramVersionRequirement programVersionRequirement) {
            if (programVersionRequirement == null) {
                return null;
            }

            StudentRequirementWaiver waiver = waiversByProgramVersionRequirementId.get(programVersionRequirement.getId());
            if (waiver != null) {
                return waiver;
            }

            Requirement requirement = programVersionRequirement.getRequirement();
            return requirement == null ? null : waiversByRequirementId.get(requirement.getId());
        }
    }
}
