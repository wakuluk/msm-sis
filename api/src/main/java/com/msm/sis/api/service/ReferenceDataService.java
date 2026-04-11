package com.msm.sis.api.service;

import com.msm.sis.api.dto.catalog.*;
import com.msm.sis.api.dto.reference.ReferenceOptionResponse;
import com.msm.sis.api.dto.student.StudentReferenceOptionsResponse;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.CatalogCourseOfferingStatusRepository;
import com.msm.sis.api.repository.AcademicSubjectRepository;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicTermStatusRepository;
import com.msm.sis.api.repository.ClassStandingRepository;
import com.msm.sis.api.repository.EthnicityRepository;
import com.msm.sis.api.repository.GenderRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class ReferenceDataService {

    private final AcademicYearRepository catalogAcademicYearRepository;
    private final CatalogCourseOfferingStatusRepository catalogCourseOfferingStatusRepository;
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicSubjectRepository academicSubjectRepository;
    private final AcademicTermRepository AcademicTermRepository;
    private final AcademicTermStatusRepository AcademicTermStatusRepository;
    private final EthnicityRepository ethnicityRepository;
    private final ClassStandingRepository classStandingRepository;
    private final GenderRepository genderRepository;

    public ReferenceDataService(
            AcademicYearRepository catalogAcademicYearRepository,
            CatalogCourseOfferingStatusRepository catalogCourseOfferingStatusRepository,
            AcademicDepartmentRepository academicDepartmentRepository,
            AcademicSubjectRepository academicSubjectRepository,
            AcademicTermRepository AcademicTermRepository,
            AcademicTermStatusRepository AcademicTermStatusRepository,
            GenderRepository genderRepository,
            EthnicityRepository ethnicityRepository,
            ClassStandingRepository classStandingRepository
    ) {
        this.catalogAcademicYearRepository = catalogAcademicYearRepository;
        this.catalogCourseOfferingStatusRepository = catalogCourseOfferingStatusRepository;
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.academicSubjectRepository = academicSubjectRepository;
        this.AcademicTermRepository = AcademicTermRepository;
        this.AcademicTermStatusRepository = AcademicTermStatusRepository;
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
                catalogAcademicYearRepository.findAllAcademicYears().stream()
                        .map(academicYear -> new CatalogReferenceOptionResponse(
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
                        .map(department -> new CatalogReferenceOptionResponse(
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
                catalogCourseOfferingStatusRepository.findAllByActiveTrueOrderByNameAsc().stream()
                        .map(status -> new CatalogReferenceOptionResponse(
                                status.getId(),
                                status.getCode(),
                                status.getName()
                        ))
                        .toList(),
                AcademicTermStatusRepository.findAllByActiveTrueOrderByNameAsc().stream()
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
                catalogAcademicYearRepository.findAllPublishedActiveOrderByStartDateAsc().stream()
                        .map(academicYear -> new CatalogReferenceOptionResponse(
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
                        .map(department -> new CatalogReferenceOptionResponse(
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
