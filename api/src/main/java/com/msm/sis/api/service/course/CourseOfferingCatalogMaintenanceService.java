package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.ImportAcademicYearCourseOfferingsResponse;
import com.msm.sis.api.dto.course.SyncAcademicYearCourseOfferingsResponse;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.CourseOfferingRepository;
import com.msm.sis.api.repository.CourseVersionRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class CourseOfferingCatalogMaintenanceService {
    private final AcademicYearRepository academicYearRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final EntityManager entityManager;

    @Transactional
    public ImportAcademicYearCourseOfferingsResponse importCurrentCourseVersionsIntoAcademicYear(
            Long academicYearId
    ) {
        requirePositiveId(academicYearId, "Academic year id");

        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<CourseVersion> eligibleCurrentCourseVersions = courseVersionRepository.findCurrentCourseVersions().stream()
                .filter(courseVersion -> courseVersion.getCourse() != null && courseVersion.getCourse().isActive())
                .toList();

        List<CourseOffering> courseOfferingsToCreate = eligibleCurrentCourseVersions.stream()
                .filter(courseVersion -> !courseOfferingRepository.existsByCourseIdAndAcademicYearId(
                        courseVersion.getCourse().getId(),
                        academicYearId
                ))
                .map(courseVersion -> buildCourseOffering(academicYear, courseVersion))
                .toList();

        courseOfferingRepository.saveAll(courseOfferingsToCreate);
        courseOfferingRepository.flush();

        return new ImportAcademicYearCourseOfferingsResponse(
                academicYearId,
                eligibleCurrentCourseVersions.size(),
                courseOfferingsToCreate.size(),
                eligibleCurrentCourseVersions.size() - courseOfferingsToCreate.size()
        );
    }

    @Transactional
    public SyncAcademicYearCourseOfferingsResponse syncAcademicYearCourseOfferingsToCurrentCourseVersions(
            Long academicYearId
    ) {
        requirePositiveId(academicYearId, "Academic year id");

        academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<CourseOffering> courseOfferings = courseOfferingRepository.findAllByAcademicYear_Id(
                academicYearId,
                Sort.by(Sort.Direction.ASC, "id")
        );
        List<Long> courseIds = courseOfferings.stream()
                .map(CourseOffering::getCourseVersion)
                .filter(Objects::nonNull)
                .map(CourseVersion::getCourse)
                .filter(Objects::nonNull)
                .map(com.msm.sis.api.entity.Course::getId)
                .distinct()
                .toList();

        Map<Long, CourseVersion> currentCourseVersionsByCourseId = courseIds.isEmpty()
                ? Map.of()
                : courseVersionRepository.findCurrentCourseVersionsByCourseIds(courseIds)
                        .stream()
                        .filter(courseVersion -> courseVersion.getCourse() != null)
                        .collect(java.util.stream.Collectors.toMap(
                                courseVersion -> courseVersion.getCourse().getId(),
                                courseVersion -> courseVersion,
                                (left, right) -> left,
                                LinkedHashMap::new
                        ));

        Set<Long> courseIdsWithCurrentOffering = courseOfferings.stream()
                .map(courseOffering -> courseIdWhenOfferingUsesCurrentCourseVersion(
                        courseOffering,
                        currentCourseVersionsByCourseId
                ))
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        int updatedCourseOfferingCount = 0;
        int alreadyCurrentCourseOfferingCount = 0;
        int skippedMissingCurrentCourseVersionCount = 0;
        int skippedDuplicateCurrentOfferingCount = 0;
        List<CourseOffering> courseOfferingsToUpdate = new java.util.ArrayList<>();

        for (CourseOffering courseOffering : courseOfferings) {
            CourseVersion existingCourseVersion = courseOffering.getCourseVersion();
            Long courseId = existingCourseVersion == null || existingCourseVersion.getCourse() == null
                    ? null
                    : existingCourseVersion.getCourse().getId();

            if (courseId == null) {
                skippedMissingCurrentCourseVersionCount++;
                continue;
            }

            CourseVersion currentCourseVersion = currentCourseVersionsByCourseId.get(courseId);
            if (currentCourseVersion == null) {
                skippedMissingCurrentCourseVersionCount++;
                continue;
            }

            if (Objects.equals(existingCourseVersion.getId(), currentCourseVersion.getId())) {
                alreadyCurrentCourseOfferingCount++;
                continue;
            }

            if (courseIdsWithCurrentOffering.contains(courseId)) {
                skippedDuplicateCurrentOfferingCount++;
                continue;
            }

            courseOffering.setCourseVersion(currentCourseVersion);
            courseIdsWithCurrentOffering.add(courseId);
            courseOfferingsToUpdate.add(courseOffering);
            updatedCourseOfferingCount++;
        }

        if (updatedCourseOfferingCount > 0) {
            courseOfferingRepository.saveAll(courseOfferingsToUpdate);
            courseOfferingRepository.flush();
            entityManager.clear();
        }

        return new SyncAcademicYearCourseOfferingsResponse(
                academicYearId,
                courseOfferings.size(),
                updatedCourseOfferingCount,
                alreadyCurrentCourseOfferingCount,
                skippedMissingCurrentCourseVersionCount,
                skippedDuplicateCurrentOfferingCount
        );
    }

    public CourseVersion getCurrentCourseVersion(Long courseId) {
        return courseVersionRepository.findCurrentCourseVersionsByCourseId(courseId).stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course must have a current version before it can be added to the catalog."
                ));
    }

    private Long courseIdWhenOfferingUsesCurrentCourseVersion(
            CourseOffering courseOffering,
            Map<Long, CourseVersion> currentCourseVersionsByCourseId
    ) {
        CourseVersion courseVersion = courseOffering.getCourseVersion();
        if (courseVersion == null || courseVersion.getCourse() == null) {
            return null;
        }

        CourseVersion currentCourseVersion = currentCourseVersionsByCourseId.get(
                courseVersion.getCourse().getId()
        );

        if (currentCourseVersion == null) {
            return null;
        }

        return Objects.equals(courseVersion.getId(), currentCourseVersion.getId())
                ? courseVersion.getCourse().getId()
                : null;
    }

    private CourseOffering buildCourseOffering(
            AcademicYear academicYear,
            CourseVersion courseVersion
    ) {
        CourseOffering courseOffering = new CourseOffering();
        courseOffering.setAcademicYear(academicYear);
        courseOffering.setCourseVersion(courseVersion);
        courseOffering.setNotes(null);
        return courseOffering;
    }
}
