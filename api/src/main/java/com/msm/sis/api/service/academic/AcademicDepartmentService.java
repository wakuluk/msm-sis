package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.PatchAcademicDepartmentRequest;
import com.msm.sis.api.dto.academic.AcademicDepartmentResponse;
import com.msm.sis.api.dto.academic.AcademicDepartmentSubjectResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.patch.PatchValue;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicSubjectRepository;
import com.msm.sis.api.validation.ValidationUtils;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicDepartmentService {

    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicSubjectRepository academicSubjectRepository;

    public AcademicDepartmentService(
            AcademicDepartmentRepository academicDepartmentRepository,
            AcademicSubjectRepository academicSubjectRepository
    ) {
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.academicSubjectRepository = academicSubjectRepository;
    }

    @Transactional(readOnly = true)
    public List<AcademicDepartmentResponse> searchAcademicDepartments(
            String sortBy,
            String sortDirection
    ) {
        return academicDepartmentRepository.findAll(buildSearchSort(sortBy, sortDirection)).stream()
                .map(department -> toAcademicDepartmentResponse(department, List.of()))
                .toList();
    }

    @Transactional(readOnly = true)
    public AcademicDepartmentResponse getAcademicDepartment(Long departmentId) {
        return getAcademicDepartment(departmentId, "code", "asc");
    }

    @Transactional(readOnly = true)
    public AcademicDepartmentResponse getAcademicDepartment(
            Long departmentId,
            String subjectSortBy,
            String subjectSortDirection
    ) {
        AcademicDepartment academicDepartment = getAcademicDepartmentEntity(departmentId);

        return toAcademicDepartmentResponse(
                academicDepartment,
                academicSubjectRepository.findAllByDepartment_Id(
                        departmentId,
                        buildAcademicSubjectSort(subjectSortBy, subjectSortDirection)
                )
        );
    }

    @Transactional
    public AcademicDepartmentResponse patchAcademicDepartment(
            Long departmentId,
            PatchAcademicDepartmentRequest request
    ) {
        AcademicDepartment existingAcademicDepartment = getAcademicDepartmentEntity(departmentId);
        AcademicDepartment candidateAcademicDepartment = copyAcademicDepartment(existingAcademicDepartment);

        applyPatch(candidateAcademicDepartment, request);
        validatePatchAcademicDepartment(existingAcademicDepartment, candidateAcademicDepartment);

        if (!hasPatchableChanges(existingAcademicDepartment, candidateAcademicDepartment)) {
            return getAcademicDepartment(departmentId);
        }

        copyPatchableFields(candidateAcademicDepartment, existingAcademicDepartment);
        academicDepartmentRepository.save(existingAcademicDepartment);
        return getAcademicDepartment(departmentId);
    }

    private AcademicDepartment getAcademicDepartmentEntity(Long departmentId) {
        return academicDepartmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private Sort buildSearchSort(String sortBy, String sortDirection) {
        String sortProperty = switch (sortBy == null ? "name" : sortBy.trim()) {
            case "code" -> "code";
            case "name" -> "name";
            case "active" -> "active";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: code, name, active."
            );
        };

        return Sort.by(parseSortDirection(sortDirection), sortProperty)
                .and(Sort.by(Sort.Direction.ASC, "name"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Sort buildAcademicSubjectSort(String sortBy, String sortDirection) {
        String sortProperty = switch (sortBy == null ? "code" : sortBy.trim()) {
            case "code" -> "code";
            case "name" -> "name";
            case "active" -> "active";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: code, name, active."
            );
        };

        return Sort.by(parseSortDirection(sortDirection), sortProperty)
                .and(Sort.by(Sort.Direction.ASC, "code"))
                .and(Sort.by(Sort.Direction.ASC, "name"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        try {
            return Sort.Direction.fromString(sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

    private AcademicDepartment copyAcademicDepartment(AcademicDepartment academicDepartment) {
        AcademicDepartment copy = new AcademicDepartment();
        copy.setId(academicDepartment.getId());
        copy.setCode(academicDepartment.getCode());
        copy.setName(academicDepartment.getName());
        copy.setActive(academicDepartment.isActive());
        return copy;
    }

    private void copyPatchableFields(AcademicDepartment source, AcademicDepartment target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setActive(source.isActive());
    }

    private void applyPatch(AcademicDepartment academicDepartment, PatchAcademicDepartmentRequest request) {
        applyTrimmed(request.getCode(), academicDepartment::setCode);
        applyTrimmed(request.getName(), academicDepartment::setName);
        applyRequiredBoolean(request.getActive(), academicDepartment::setActive, "Academic department active flag");
    }

    private void validatePatchAcademicDepartment(
            AcademicDepartment existingAcademicDepartment,
            AcademicDepartment candidateAcademicDepartment
    ) {
        String candidateCode = trimToNull(candidateAcademicDepartment.getCode());
        String candidateName = trimToNull(candidateAcademicDepartment.getName());

        if (candidateCode == null || candidateName == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic department code and name are required."
            );
        }

        ValidationUtils.validateMaxLength(candidateCode, 20, "Academic department code");
        ValidationUtils.validateMaxLength(candidateName, 255, "Academic department name");

        String existingCode = trimToNull(existingAcademicDepartment.getCode());
        if (!Objects.equals(existingCode, candidateCode)
                && academicDepartmentRepository.existsByCode(candidateCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic department code already exists."
            );
        }
    }

    private boolean hasPatchableChanges(AcademicDepartment existing, AcademicDepartment candidate) {
        return !Objects.equals(trimToNull(existing.getCode()), trimToNull(candidate.getCode()))
                || !Objects.equals(trimToNull(existing.getName()), trimToNull(candidate.getName()))
                || existing.isActive() != candidate.isActive();
    }

    private void applyTrimmed(PatchValue<String> value, Consumer<String> consumer) {
        if (value.isPresent()) {
            consumer.accept(trimToNull(value.orElse(null)));
        }
    }

    private void applyRequiredBoolean(
            PatchValue<Boolean> value,
            Consumer<Boolean> consumer,
            String fieldName
    ) {
        if (!value.isPresent()) {
            return;
        }

        Boolean patchedValue = value.orElse(null);
        if (patchedValue == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }

        consumer.accept(patchedValue);
    }

    private AcademicDepartmentResponse toAcademicDepartmentResponse(
            AcademicDepartment department,
            List<AcademicSubject> subjects
    ) {
        return new AcademicDepartmentResponse(
                department.getId(),
                department.getCode(),
                department.getName(),
                department.isActive(),
                subjects.stream()
                        .map(this::toAcademicDepartmentSubjectResponse)
                        .toList()
        );
    }

    private AcademicDepartmentSubjectResponse toAcademicDepartmentSubjectResponse(
            AcademicSubject subject
    ) {
        return new AcademicDepartmentSubjectResponse(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                subject.isActive()
        );
    }
}
