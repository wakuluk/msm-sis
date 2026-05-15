package com.msm.sis.api.service.transfer;

import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.TransferCourseEquivalency;
import com.msm.sis.api.entity.TransferCourseEquivalencyOutcome;
import com.msm.sis.api.entity.TransferInstitution;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.entity.TransferRequestCourse;
import com.msm.sis.api.entity.TransferRequestOutcome;
import com.msm.sis.api.repository.TransferCourseEquivalencyOutcomeRepository;
import com.msm.sis.api.repository.TransferCourseEquivalencyRepository;
import com.msm.sis.api.repository.TransferRequestCourseRepository;
import com.msm.sis.api.repository.TransferRequestOutcomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class TransferCourseEquivalencyMappingService {

    private final TransferCourseEquivalencyOutcomeRepository transferCourseEquivalencyOutcomeRepository;
    private final TransferCourseEquivalencyRepository transferCourseEquivalencyRepository;
    private final TransferRequestCourseRepository transferRequestCourseRepository;
    private final TransferRequestOutcomeRepository transferRequestOutcomeRepository;

    @Transactional
    public void saveOrUpdateMappingsFromRequest(TransferRequest transferRequest, SisUser currentUser) {
        TransferInstitution institution = transferRequest.getTransferInstitution();
        if (institution == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Transfer request must have a saved institution before saving institution mappings."
            );
        }

        List<TransferRequestCourse> requestCourses =
                transferRequestCourseRepository.findByTransferRequestIdOrderBySortOrderAscIdAsc(transferRequest.getId());
        for (TransferRequestCourse requestCourse : requestCourses) {
            saveOrUpdateMappingFromRequestCourse(institution, requestCourse, currentUser);
        }
    }

    private void saveOrUpdateMappingFromRequestCourse(
            TransferInstitution institution,
            TransferRequestCourse requestCourse,
            SisUser currentUser
    ) {
        String externalSubjectCode = trimToNull(requestCourse.getExternalSubjectCode());
        String externalCourseNumber = trimToNull(requestCourse.getExternalCourseNumber());
        if (externalSubjectCode == null || externalCourseNumber == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested course must include an external subject code and course number before saving mapping."
            );
        }

        transferCourseEquivalencyRepository
                .findFirstByTransferInstitution_IdAndExternalSubjectCodeAndExternalCourseNumberAndActiveTrueOrderByIdDesc(
                        institution.getId(),
                        externalSubjectCode,
                        externalCourseNumber
                )
                .ifPresent(existingEquivalency -> {
                    existingEquivalency.setActive(false);
                    existingEquivalency.setUpdatedByUser(currentUser);
                    transferCourseEquivalencyRepository.saveAndFlush(existingEquivalency);
                });

        TransferCourseEquivalency equivalency = new TransferCourseEquivalency();
        equivalency.setTransferInstitution(institution);
        equivalency.setExternalSubjectCode(externalSubjectCode);
        equivalency.setExternalCourseNumber(externalCourseNumber);
        equivalency.setExternalCourseTitle(trimToNull(requestCourse.getExternalCourseTitle()));
        equivalency.setExternalCourseDescription(trimToNull(requestCourse.getExternalCourseDescription()));
        equivalency.setExternalCredits(requestCourse.getRequestedCredits());
        equivalency.setActive(true);
        equivalency.setNotes("Saved from transfer request #" + requestCourse.getTransferRequest().getId());
        equivalency.setCreatedByUser(currentUser);
        equivalency.setUpdatedByUser(currentUser);

        TransferCourseEquivalency savedEquivalency = transferCourseEquivalencyRepository.save(equivalency);

        List<TransferRequestOutcome> requestOutcomes =
                transferRequestOutcomeRepository.findByTransferRequestCourseIdOrderByIdAsc(requestCourse.getId());
        AtomicInteger sortOrder = new AtomicInteger();
        List<TransferCourseEquivalencyOutcome> savedOutcomes = requestOutcomes.stream()
                .map(requestOutcome -> buildSavedOutcome(savedEquivalency, requestOutcome, sortOrder.getAndIncrement()))
                .toList();
        transferCourseEquivalencyOutcomeRepository.saveAll(savedOutcomes);
    }

    private TransferCourseEquivalencyOutcome buildSavedOutcome(
            TransferCourseEquivalency equivalency,
            TransferRequestOutcome requestOutcome,
            int sortOrder
    ) {
        TransferCourseEquivalencyOutcome savedOutcome = new TransferCourseEquivalencyOutcome();
        savedOutcome.setEquivalency(equivalency);
        savedOutcome.setOutcomeType(requestOutcome.getOutcomeType());
        savedOutcome.setLocalCourse(requestOutcome.getLocalCourse());
        savedOutcome.setRequirement(requestOutcome.getRequirement());
        savedOutcome.setProgramVersionRequirement(requestOutcome.getProgramVersionRequirement());
        savedOutcome.setAcceptedCredits(requestOutcome.getAcceptedCredits());
        savedOutcome.setNotes(requestOutcome.getNotes());
        savedOutcome.setSortOrder(sortOrder);
        return savedOutcome;
    }
}
