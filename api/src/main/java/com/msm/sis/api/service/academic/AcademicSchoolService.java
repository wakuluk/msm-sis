package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.AcademicDepartmentResponse;
import com.msm.sis.api.dto.academic.AcademicSchoolResponse;
import com.msm.sis.api.dto.academic.school.AcademicSchoolDepartmentSearchCriteria;
import com.msm.sis.api.dto.academic.school.AcademicSchoolDepartmentSearchResultResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.mapper.AcademicDepartmentMapper;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicSchoolRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AcademicSchoolService {

    private final AcademicSchoolRepository academicSchoolRepository;
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicDepartmentMapper academicDepartmentMapper;
    private final AcademicSchoolValidationService academicSchoolValidationService;

    public AcademicSchoolService(
            AcademicSchoolRepository academicSchoolRepository,
            AcademicDepartmentRepository academicDepartmentRepository,
            AcademicDepartmentMapper academicDepartmentMapper,
            AcademicSchoolValidationService academicSchoolValidationService
    ) {
        this.academicSchoolRepository = academicSchoolRepository;
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.academicDepartmentMapper = academicDepartmentMapper;
        this.academicSchoolValidationService = academicSchoolValidationService;
    }

    @Transactional(readOnly = true)
    public AcademicSchoolResponse getAcademicSchoolById(Long id) {
        AcademicSchool school = academicSchoolRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<AcademicDepartmentResponse> departments = academicDepartmentRepository.findAllBySchool_IdIn(
                List.of(id),
                Sort.by(Sort.Direction.ASC, "name")
                        .and(Sort.by(Sort.Direction.ASC, "code"))
                        .and(Sort.by(Sort.Direction.ASC, "id"))
                ).stream()
                .map(academicDepartmentMapper::toAcademicDepartmentResponse)
                .toList();

        return new AcademicSchoolResponse(
                school.getId(),
                school.getCode(),
                school.getName(),
                school.isActive(),
                departments
        );
    }

    @Transactional(readOnly = true)
    public List<AcademicSchoolDepartmentSearchResultResponse> searchAcademicSchools(
            AcademicSchoolDepartmentSearchCriteria criteria
    ) {
        AcademicSchoolDepartmentSearchCriteria effectiveCriteria =
                criteria == null ? new AcademicSchoolDepartmentSearchCriteria() : criteria;
        academicSchoolValidationService.validateSearchCriteria(effectiveCriteria);

        List<AcademicSchool> schools = academicSchoolRepository.findAll(
                Sort.by(Sort.Direction.ASC, "name")
                        .and(Sort.by(Sort.Direction.ASC, "code"))
                        .and(Sort.by(Sort.Direction.ASC, "id"))
        ).stream()
                .filter(school -> effectiveCriteria.getSchoolId() == null
                        || Objects.equals(school.getId(), effectiveCriteria.getSchoolId()))
                .toList();

        if (schools.isEmpty()) {
            return List.of();
        }

        List<AcademicDepartment> departments = academicDepartmentRepository.findAllBySchool_IdIn(
                schools.stream().map(AcademicSchool::getId).toList(),
                Sort.by(Sort.Direction.ASC, "name")
                        .and(Sort.by(Sort.Direction.ASC, "code"))
                        .and(Sort.by(Sort.Direction.ASC, "id"))
        ).stream()
                .filter(department ->
                        effectiveCriteria.getDepartmentId() == null
                                || Objects.equals(department.getId(), effectiveCriteria.getDepartmentId()))
                .toList();

        Map<Long, List<AcademicDepartment>> departmentsBySchoolId = new LinkedHashMap<>();
        schools.forEach(school -> departmentsBySchoolId.put(school.getId(), new ArrayList<>()));

        departments.forEach(department -> {
            if (department.getSchool() == null || department.getSchool().getId() == null) {
                return;
            }

            List<AcademicDepartment> schoolDepartments = departmentsBySchoolId.get(department.getSchool().getId());
            if (schoolDepartments != null) {
                schoolDepartments.add(department);
            }
        });

        List<AcademicSchoolDepartmentSearchResultResponse> results = new ArrayList<>();

        for (AcademicSchool school : schools) {
            List<AcademicDepartment> schoolDepartments = departmentsBySchoolId.getOrDefault(school.getId(), List.of());

            if (schoolDepartments.isEmpty()) {
                if (effectiveCriteria.getDepartmentId() != null) {
                    continue;
                }

                results.add(new AcademicSchoolDepartmentSearchResultResponse(
                        school.getId(),
                        school.getCode(),
                        school.getName(),
                        school.isActive(),
                        null,
                        null,
                        null,
                        false
                ));
                continue;
            }

            schoolDepartments.forEach(department -> results.add(new AcademicSchoolDepartmentSearchResultResponse(
                    school.getId(),
                    school.getCode(),
                    school.getName(),
                    school.isActive(),
                    department.getId(),
                    department.getCode(),
                    department.getName(),
                    department.isActive()
            )));
        }

        return results.stream()
                .sorted(buildSearchComparator(effectiveCriteria))
                .toList();
    }


    @Transactional(readOnly = true)
    public List<AcademicSchoolResponse> getAcademicSchools() {
        List<AcademicSchool> schools = academicSchoolRepository.findAll(
                Sort.by(Sort.Direction.ASC, "name")
                        .and(Sort.by(Sort.Direction.ASC, "code"))
                        .and(Sort.by(Sort.Direction.ASC, "id"))
        );

        if (schools.isEmpty()) {
            return List.of();
        }

        Map<Long, List<AcademicDepartmentResponse>> departmentsBySchoolId = new LinkedHashMap<>();
        schools.forEach(school -> departmentsBySchoolId.put(school.getId(), new ArrayList<>()));

        List<AcademicDepartment> departments = academicDepartmentRepository.findAllBySchool_IdIn(
                schools.stream().map(AcademicSchool::getId).toList(),
                Sort.by(Sort.Direction.ASC, "name")
                        .and(Sort.by(Sort.Direction.ASC, "code"))
                        .and(Sort.by(Sort.Direction.ASC, "id"))
        );

        departments.forEach(department -> {
            if (department.getSchool() == null || department.getSchool().getId() == null) {
                return;
            }

            List<AcademicDepartmentResponse> schoolDepartments =
                    departmentsBySchoolId.get(department.getSchool().getId());

            if (schoolDepartments == null) {
                return;
            }

            schoolDepartments.add(academicDepartmentMapper.toAcademicDepartmentResponse(department));
        });

        return schools.stream()
                .map(school -> new AcademicSchoolResponse(
                        school.getId(),
                        school.getCode(),
                        school.getName(),
                        school.isActive(),
                        List.copyOf(departmentsBySchoolId.getOrDefault(school.getId(), List.of()))
                ))
                .toList();
    }

    //TODO, the strings in this case / switch are bad
    private Comparator<AcademicSchoolDepartmentSearchResultResponse> buildSearchComparator(
            AcademicSchoolDepartmentSearchCriteria criteria
    ) {
        String sortBy = academicSchoolValidationService.normalizeSearchSortBy(
                criteria == null ? null : criteria.getSortBy()
        );
        Sort.Direction sortDirection = academicSchoolValidationService.parseSearchSortDirection(
                criteria == null ? null : criteria.getSortDirection()
        );

        Comparator<AcademicSchoolDepartmentSearchResultResponse> comparator = switch (sortBy) {
            case "schoolCode" -> Comparator.comparing(
                    AcademicSchoolDepartmentSearchResultResponse::schoolCode,
                    String.CASE_INSENSITIVE_ORDER
            );
            case "schoolName" -> Comparator.comparing(
                    AcademicSchoolDepartmentSearchResultResponse::schoolName,
                    String.CASE_INSENSITIVE_ORDER
            );
            case "schoolActive" -> Comparator.comparing(AcademicSchoolDepartmentSearchResultResponse::schoolActive);
            case "departmentCode" -> Comparator.comparing(
                    AcademicSchoolDepartmentSearchResultResponse::departmentCode,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
            );
            case "departmentName" -> Comparator.comparing(
                    AcademicSchoolDepartmentSearchResultResponse::departmentName,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
            );
            case "departmentActive" -> Comparator.comparing(
                    result -> result.departmentId() == null ? null : result.departmentActive(),
                    Comparator.nullsLast(Boolean::compareTo)
            );
            default -> throw new IllegalStateException("Unsupported academic school search sort: " + sortBy);
        };

        if (sortDirection == Sort.Direction.DESC) {
            comparator = comparator.reversed();
        }

        return comparator
                .thenComparing(AcademicSchoolDepartmentSearchResultResponse::schoolName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(AcademicSchoolDepartmentSearchResultResponse::schoolCode, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(
                        AcademicSchoolDepartmentSearchResultResponse::departmentName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                )
                .thenComparing(
                        AcademicSchoolDepartmentSearchResultResponse::departmentCode,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                )
                .thenComparing(AcademicSchoolDepartmentSearchResultResponse::schoolId)
                .thenComparing(
                        AcademicSchoolDepartmentSearchResultResponse::departmentId,
                        Comparator.nullsLast(Long::compareTo)
                );
    }
}
