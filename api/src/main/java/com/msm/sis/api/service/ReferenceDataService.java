package com.msm.sis.api.service;

import com.msm.sis.api.dto.academic.AcademicDepartmentReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSchoolDepartmentSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.academic.AcademicSubjectReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicTermReferenceOptionResponse;
import com.msm.sis.api.dto.catalog.*;
import com.msm.sis.api.dto.course.CourseSearchReferenceOptionsResponse;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.repository.AcademicSchoolRepository;
import com.msm.sis.api.dto.student.StudentReferenceOptionsResponse;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.CourseOfferingStatusRepository;
import com.msm.sis.api.repository.AcademicSubjectRepository;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicTermStatusRepository;
import com.msm.sis.api.repository.ClassStandingRepository;
import com.msm.sis.api.repository.EthnicityRepository;
import com.msm.sis.api.repository.GenderRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReferenceDataService {

    private final AcademicYearRepository catalogAcademicYearRepository;
    private final CourseOfferingStatusRepository courseOfferingStatusRepository;
    private final AcademicSchoolRepository academicSchoolRepository;
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicSubjectRepository academicSubjectRepository;
    private final AcademicTermRepository AcademicTermRepository;
    private final AcademicTermStatusRepository AcademicTermStatusRepository;
    private final EthnicityRepository ethnicityRepository;
    private final ClassStandingRepository classStandingRepository;
    private final GenderRepository genderRepository;

    public ReferenceDataService(
            AcademicYearRepository catalogAcademicYearRepository,
            CourseOfferingStatusRepository courseOfferingStatusRepository,
            AcademicSchoolRepository academicSchoolRepository,
            AcademicDepartmentRepository academicDepartmentRepository,
            AcademicSubjectRepository academicSubjectRepository,
            AcademicTermRepository AcademicTermRepository,
            AcademicTermStatusRepository AcademicTermStatusRepository,
            GenderRepository genderRepository,
            EthnicityRepository ethnicityRepository,
            ClassStandingRepository classStandingRepository
    ) {
        this.catalogAcademicYearRepository = catalogAcademicYearRepository;
        this.courseOfferingStatusRepository = courseOfferingStatusRepository;
        this.academicSchoolRepository = academicSchoolRepository;
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.academicSubjectRepository = academicSubjectRepository;
        this.AcademicTermRepository = AcademicTermRepository;
        this.AcademicTermStatusRepository = AcademicTermStatusRepository;
        this.genderRepository = genderRepository;
        this.ethnicityRepository = ethnicityRepository;
        this.classStandingRepository = classStandingRepository;
    }

    @Transactional(readOnly = true)
    public AcademicSchoolDepartmentSearchReferenceOptionsResponse
    getAcademicSchoolDepartmentSearchReferenceOptions() {
        List<AcademicSchool> schools = academicSchoolRepository.findAllByActiveTrueOrderByNameAsc();
        List<CodeNameReferenceOptionResponse> schoolOptions = schools.stream()
                .map(school -> new CodeNameReferenceOptionResponse(
                        school.getId(),
                        school.getCode(),
                        school.getName()
                ))
                .toList();

        if (schools.isEmpty()) {
            return new AcademicSchoolDepartmentSearchReferenceOptionsResponse(schoolOptions, List.of());
        }

        return new AcademicSchoolDepartmentSearchReferenceOptionsResponse(
                schoolOptions,
                academicDepartmentRepository.findAllByActiveTrueAndSchool_IdIn(
                                schools.stream().map(AcademicSchool::getId).toList(),
                                Sort.by(Sort.Direction.ASC, "name")
                                        .and(Sort.by(Sort.Direction.ASC, "code"))
                                        .and(Sort.by(Sort.Direction.ASC, "id"))
                        ).stream()
                        .map(department -> new AcademicDepartmentReferenceOptionResponse(
                                department.getId(),
                                department.getCode(),
                                department.getName(),
                                department.getSchool().getId()
                        ))
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public CourseSearchReferenceOptionsResponse getCourseSearchReferenceOptions() {
        List<AcademicSchool> schools = academicSchoolRepository.findAllByActiveTrueOrderByNameAsc();
        List<CodeNameReferenceOptionResponse> schoolOptions = schools.stream()
                .map(school -> new CodeNameReferenceOptionResponse(
                        school.getId(),
                        school.getCode(),
                        school.getName()
                ))
                .toList();

        if (schools.isEmpty()) {
            return new CourseSearchReferenceOptionsResponse(List.of(), List.of(), List.of());
        }

        List<Long> schoolIds = schools.stream()
                .map(AcademicSchool::getId)
                .toList();

        return new CourseSearchReferenceOptionsResponse(
                schoolOptions,
                academicDepartmentRepository.findAllByActiveTrueAndSchool_IdIn(
                                schoolIds,
                                Sort.by(Sort.Direction.ASC, "name")
                                        .and(Sort.by(Sort.Direction.ASC, "code"))
                                        .and(Sort.by(Sort.Direction.ASC, "id"))
                        ).stream()
                        .map(department -> new AcademicDepartmentReferenceOptionResponse(
                                department.getId(),
                                department.getCode(),
                                department.getName(),
                                department.getSchool().getId()
                        ))
                        .toList(),
                academicSubjectRepository.findAllByActiveTrueOrderByCodeAsc().stream()
                        .map(subject -> new AcademicSubjectReferenceOptionResponse(
                                subject.getId(),
                                subject.getCode(),
                                subject.getName(),
                                subject.getDepartment().getId(),
                                subject.getDepartment().getCode(),
                                subject.getDepartment().getName()
                        ))
                        .toList()
        );
    }

    public StudentReferenceOptionsResponse getStudentReferenceOptions() {
        return new StudentReferenceOptionsResponse(
                genderRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                        .map(gender -> new com.msm.sis.api.dto.reference.ReferenceOptionResponse(gender.getId(), gender.getName()))
                        .toList(),
                ethnicityRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                        .map(ethnicity -> new com.msm.sis.api.dto.reference.ReferenceOptionResponse(ethnicity.getId(), ethnicity.getName()))
                        .toList(),
                classStandingRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                        .map(classStanding -> new com.msm.sis.api.dto.reference.ReferenceOptionResponse(classStanding.getId(), classStanding.getName()))
                        .toList()
        );
    }

    public CatalogAdvancedSearchReferenceOptionsResponse getCatalogAdvanceSearchReferenceOptions() {
        return new CatalogAdvancedSearchReferenceOptionsResponse(
                catalogAcademicYearRepository.findAllAcademicYears().stream()
                        .map(academicYear -> new CodeNameReferenceOptionResponse(
                                academicYear.getId(),
                                academicYear.getCode(),
                                academicYear.getName()
                        ))
                        .toList(),
                AcademicTermRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(term -> new AcademicTermReferenceOptionResponse(
                                term.getId(),
                                term.getCode(),
                                term.getName(),
                                term.getAcademicYear().getId(),
                                term.getAcademicYear().getCode(),
                                term.getAcademicYear().getName()
                        ))
                        .toList(),
                academicDepartmentRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(department -> new CodeNameReferenceOptionResponse(
                                department.getId(),
                                department.getCode(),
                                department.getName()
                        ))
                        .toList(),
                academicSubjectRepository.findAllByActiveTrueOrderByCodeAsc().stream()
                        .map(subject -> new AcademicSubjectReferenceOptionResponse(
                                subject.getId(),
                                subject.getCode(),
                                subject.getName(),
                                subject.getDepartment().getId(),
                                subject.getDepartment().getCode(),
                                subject.getDepartment().getName()
                        ))
                        .toList(),
                courseOfferingStatusRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(status -> new CodeNameReferenceOptionResponse(
                                status.getId(),
                                status.getCode(),
                                status.getName()
                        ))
                        .toList(),
                AcademicTermStatusRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(status -> new CodeNameReferenceOptionResponse(
                                status.getId(),
                                status.getCode(),
                                status.getName()
                        ))
                        .toList()
        );
    }

    public CatalogSearchReferenceOptionsResponse getCatalogSearchReferenceOptions() {
        return new CatalogSearchReferenceOptionsResponse(
                catalogAcademicYearRepository.findAllPublishedActiveOrderByStartDateAsc().stream()
                        .map(academicYear -> new CodeNameReferenceOptionResponse(
                                academicYear.getId(),
                                academicYear.getCode(),
                                academicYear.getName()
                        ))
                        .toList(),
                AcademicTermRepository.findAllForStudentCatalogSearchOrderBySortOrderAsc().stream()
                        .map(term -> new AcademicTermReferenceOptionResponse(
                                term.getId(),
                                term.getCode(),
                                term.getName(),
                                term.getAcademicYear().getId(),
                                term.getAcademicYear().getCode(),
                                term.getAcademicYear().getName()
                        ))
                        .toList(),
                academicDepartmentRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(department -> new CodeNameReferenceOptionResponse(
                                department.getId(),
                                department.getCode(),
                                department.getName()
                        ))
                        .toList(),
                academicSubjectRepository.findAllByActiveTrueOrderByCodeAsc().stream()
                        .map(subject -> new AcademicSubjectReferenceOptionResponse(
                                subject.getId(),
                                subject.getCode(),
                                subject.getName(),
                                subject.getDepartment().getId(),
                                subject.getDepartment().getCode(),
                                subject.getDepartment().getName()
                        ))
                        .toList()
        );
    }
}
