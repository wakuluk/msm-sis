package com.msm.sis.api.service;

import com.msm.sis.api.dto.*;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.CatalogAcademicYearRepository;
import com.msm.sis.api.repository.CatalogCourseOfferingStatusRepository;
import com.msm.sis.api.repository.CatalogSubjectRepository;
import com.msm.sis.api.repository.CatalogTermRepository;
import com.msm.sis.api.repository.CatalogTermStatusRepository;
import com.msm.sis.api.repository.ClassStandingRepository;
import com.msm.sis.api.repository.EthnicityRepository;
import com.msm.sis.api.repository.GenderRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class ReferenceDataService {

    private final CatalogAcademicYearRepository catalogAcademicYearRepository;
    private final CatalogCourseOfferingStatusRepository catalogCourseOfferingStatusRepository;
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final CatalogSubjectRepository catalogSubjectRepository;
    private final CatalogTermRepository catalogTermRepository;
    private final CatalogTermStatusRepository catalogTermStatusRepository;
    private final EthnicityRepository ethnicityRepository;
    private final ClassStandingRepository classStandingRepository;
    private final GenderRepository genderRepository;

    public ReferenceDataService(
            CatalogAcademicYearRepository catalogAcademicYearRepository,
            CatalogCourseOfferingStatusRepository catalogCourseOfferingStatusRepository,
            AcademicDepartmentRepository academicDepartmentRepository,
            CatalogSubjectRepository catalogSubjectRepository,
            CatalogTermRepository catalogTermRepository,
            CatalogTermStatusRepository catalogTermStatusRepository,
            GenderRepository genderRepository,
            EthnicityRepository ethnicityRepository,
            ClassStandingRepository classStandingRepository
    ) {
        this.catalogAcademicYearRepository = catalogAcademicYearRepository;
        this.catalogCourseOfferingStatusRepository = catalogCourseOfferingStatusRepository;
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.catalogSubjectRepository = catalogSubjectRepository;
        this.catalogTermRepository = catalogTermRepository;
        this.catalogTermStatusRepository = catalogTermStatusRepository;
        this.genderRepository = genderRepository;
        this.ethnicityRepository = ethnicityRepository;
        this.classStandingRepository = classStandingRepository;
    }

    public StudentReferenceOptionsResponse getStudentReferenceOptions() {
        return new StudentReferenceOptionsResponse(
                genderRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                        .map(gender -> new ReferenceOptionResponse(gender.getId(), gender.getName()))
                        .toList(),
                ethnicityRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                        .map(ethnicity -> new ReferenceOptionResponse(ethnicity.getId(), ethnicity.getName()))
                        .toList(),
                classStandingRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                        .map(classStanding -> new ReferenceOptionResponse(classStanding.getId(), classStanding.getName()))
                        .toList()
        );
    }

    public CatalogAdvancedSearchReferenceOptionsResponse getCatalogAdvanceSearchReferenceOptions() {
        return new CatalogAdvancedSearchReferenceOptionsResponse(
                catalogAcademicYearRepository.findAllByActiveTrueOrderByStartDateAsc().stream()
                        .map(academicYear -> new CatalogReferenceOptionResponse(
                                academicYear.getId(),
                                academicYear.getCode(),
                                academicYear.getName()
                        ))
                        .toList(),
                catalogTermRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(term -> new CatalogTermReferenceOptionResponse(
                                term.getId(),
                                term.getCode(),
                                term.getName(),
                                term.getAcademicYear().getId(),
                                term.getAcademicYear().getCode(),
                                term.getAcademicYear().getName()
                        ))
                        .toList(),
                academicDepartmentRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(department -> new CatalogReferenceOptionResponse(
                                department.getId(),
                                department.getCode(),
                                department.getName()
                        ))
                        .toList(),
                catalogSubjectRepository.findAllByActiveTrueOrderByCodeAsc().stream()
                        .map(subject -> new CatalogSubjectReferenceOptionResponse(
                                subject.getId(),
                                subject.getCode(),
                                subject.getName(),
                                subject.getDepartment().getId(),
                                subject.getDepartment().getCode(),
                                subject.getDepartment().getName()
                        ))
                        .toList(),
                catalogCourseOfferingStatusRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(status -> new CatalogReferenceOptionResponse(
                                status.getId(),
                                status.getCode(),
                                status.getName()
                        ))
                        .toList(),
                catalogTermStatusRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(status -> new CatalogReferenceOptionResponse(
                                status.getId(),
                                status.getCode(),
                                status.getName()
                        ))
                        .toList()
        );
    }

    public CatalogSearchReferenceOptionsResponse getCatalogSearchReferenceOptions() {
        return new CatalogSearchReferenceOptionsResponse(
                catalogAcademicYearRepository.findAllByActiveTrueOrderByStartDateAsc().stream()
                        .map(academicYear -> new CatalogReferenceOptionResponse(
                                academicYear.getId(),
                                academicYear.getCode(),
                                academicYear.getName()
                        ))
                        .toList(),
                catalogTermRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(term -> new CatalogTermReferenceOptionResponse(
                                term.getId(),
                                term.getCode(),
                                term.getName(),
                                term.getAcademicYear().getId(),
                                term.getAcademicYear().getCode(),
                                term.getAcademicYear().getName()
                        ))
                        .toList(),
                academicDepartmentRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(department -> new CatalogReferenceOptionResponse(
                                department.getId(),
                                department.getCode(),
                                department.getName()
                        ))
                        .toList(),
                catalogSubjectRepository.findAllByActiveTrueOrderByCodeAsc().stream()
                        .map(subject -> new CatalogSubjectReferenceOptionResponse(
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
