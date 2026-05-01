package com.msm.sis.api.service;

import com.msm.sis.api.dto.academic.AcademicDepartmentReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSchoolDepartmentSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.academic.AcademicSubjectReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSubTermReferenceOptionResponse;
import com.msm.sis.api.dto.catalog.*;
import com.msm.sis.api.dto.course.CoursePickerReferenceOptionsResponse;
import com.msm.sis.api.dto.course.CourseReferenceOptionResponse;
import com.msm.sis.api.dto.course.CourseSearchReferenceOptionsResponse;
import com.msm.sis.api.dto.program.ProgramReferenceOptionsResponse;
import com.msm.sis.api.dto.reference.CourseSectionReferenceOptionsResponse;
import com.msm.sis.api.dto.reference.GradeMarkReferenceOptionResponse;
import com.msm.sis.api.entity.*;
import com.msm.sis.api.repository.AcademicDivisionRepository;
import com.msm.sis.api.repository.AcademicSchoolRepository;
import com.msm.sis.api.dto.student.StudentReferenceOptionsResponse;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.AcademicSubjectRepository;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.AcademicSubTermStatusRepository;
import com.msm.sis.api.repository.ClassStandingRepository;
import com.msm.sis.api.repository.CourseSectionStatusRepository;
import com.msm.sis.api.repository.DeliveryModeRepository;
import com.msm.sis.api.repository.DegreeTypeRepository;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.CourseVersionRepository;
import com.msm.sis.api.repository.EthnicityRepository;
import com.msm.sis.api.repository.GradeMarkRepository;
import com.msm.sis.api.repository.GradingBasisRepository;
import com.msm.sis.api.repository.GenderRepository;
import com.msm.sis.api.repository.ProgramTypeRepository;
import com.msm.sis.api.repository.SectionInstructorRoleRepository;
import com.msm.sis.api.repository.SectionMeetingTypeRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentStatusRepository;
import com.msm.sis.api.repository.StudentSectionGradeTypeRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReferenceDataService {

    private final AcademicYearRepository catalogAcademicYearRepository;
    private final AcademicDivisionRepository academicDivisionRepository;
    private final AcademicSchoolRepository academicSchoolRepository;
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final AcademicSubjectRepository academicSubjectRepository;
    private final AcademicSubTermRepository academicSubTermRepository;
    private final AcademicSubTermStatusRepository academicSubTermStatusRepository;
    private final CourseSectionStatusRepository courseSectionStatusRepository;
    private final DeliveryModeRepository deliveryModeRepository;
    private final GradingBasisRepository gradingBasisRepository;
    private final SectionMeetingTypeRepository sectionMeetingTypeRepository;
    private final SectionInstructorRoleRepository sectionInstructorRoleRepository;
    private final StudentSectionEnrollmentStatusRepository studentSectionEnrollmentStatusRepository;
    private final StudentSectionGradeTypeRepository studentSectionGradeTypeRepository;
    private final GradeMarkRepository gradeMarkRepository;
    private final CourseRepository courseRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final EthnicityRepository ethnicityRepository;
    private final ClassStandingRepository classStandingRepository;
    private final GenderRepository genderRepository;
    private final ProgramTypeRepository programTypeRepository;
    private final DegreeTypeRepository degreeTypeRepository;

    public ReferenceDataService(
            AcademicYearRepository catalogAcademicYearRepository,
            AcademicDivisionRepository academicDivisionRepository,
            AcademicSchoolRepository academicSchoolRepository,
            AcademicDepartmentRepository academicDepartmentRepository,
            AcademicSubjectRepository academicSubjectRepository,
            AcademicSubTermRepository academicSubTermRepository,
            AcademicSubTermStatusRepository academicSubTermStatusRepository,
            CourseSectionStatusRepository courseSectionStatusRepository,
            DeliveryModeRepository deliveryModeRepository,
            GradingBasisRepository gradingBasisRepository,
            SectionMeetingTypeRepository sectionMeetingTypeRepository,
            SectionInstructorRoleRepository sectionInstructorRoleRepository,
            StudentSectionEnrollmentStatusRepository studentSectionEnrollmentStatusRepository,
            StudentSectionGradeTypeRepository studentSectionGradeTypeRepository,
            GradeMarkRepository gradeMarkRepository,
            CourseRepository courseRepository,
            CourseVersionRepository courseVersionRepository,
            GenderRepository genderRepository,
            EthnicityRepository ethnicityRepository,
            ClassStandingRepository classStandingRepository,
            ProgramTypeRepository programTypeRepository,
            DegreeTypeRepository degreeTypeRepository
    ) {
        this.catalogAcademicYearRepository = catalogAcademicYearRepository;
        this.academicDivisionRepository = academicDivisionRepository;
        this.academicSchoolRepository = academicSchoolRepository;
        this.academicDepartmentRepository = academicDepartmentRepository;
        this.academicSubjectRepository = academicSubjectRepository;
        this.academicSubTermRepository = academicSubTermRepository;
        this.academicSubTermStatusRepository = academicSubTermStatusRepository;
        this.courseSectionStatusRepository = courseSectionStatusRepository;
        this.deliveryModeRepository = deliveryModeRepository;
        this.gradingBasisRepository = gradingBasisRepository;
        this.sectionMeetingTypeRepository = sectionMeetingTypeRepository;
        this.sectionInstructorRoleRepository = sectionInstructorRoleRepository;
        this.studentSectionEnrollmentStatusRepository = studentSectionEnrollmentStatusRepository;
        this.studentSectionGradeTypeRepository = studentSectionGradeTypeRepository;
        this.gradeMarkRepository = gradeMarkRepository;
        this.courseRepository = courseRepository;
        this.courseVersionRepository = courseVersionRepository;
        this.genderRepository = genderRepository;
        this.ethnicityRepository = ethnicityRepository;
        this.classStandingRepository = classStandingRepository;
        this.programTypeRepository = programTypeRepository;
        this.degreeTypeRepository = degreeTypeRepository;
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

    @Transactional(readOnly = true)
    public ProgramReferenceOptionsResponse getProgramReferenceOptions() {
        List<AcademicSchool> schools = academicSchoolRepository.findAllByActiveTrueOrderByNameAsc();
        List<CodeNameReferenceOptionResponse> schoolOptions = schools.stream()
                .map(school -> new CodeNameReferenceOptionResponse(
                        school.getId(),
                        school.getCode(),
                        school.getName()
                ))
                .toList();

        List<AcademicDepartmentReferenceOptionResponse> departmentOptions = schools.isEmpty()
                ? List.of()
                : academicDepartmentRepository.findAllByActiveTrueAndSchool_IdIn(
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
                        .toList();

        return new ProgramReferenceOptionsResponse(
                programTypeRepository.findOptions().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                degreeTypeRepository.findOptions().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                schoolOptions,
                departmentOptions
        );
    }

    @Transactional(readOnly = true)
    public CoursePickerReferenceOptionsResponse getCoursePickerReferenceOptions() {
        List<Course> eligibleCourses = getEligibleCoursesForPicker();

        if (eligibleCourses.isEmpty()) {
            return new CoursePickerReferenceOptionsResponse(List.of(), List.of(), List.of(), List.of());
        }

        List<AcademicSchool> schools = eligibleCourses.stream()
                .map(Course::getSubject)
                .filter(Objects::nonNull)
                .map(AcademicSubject::getDepartment)
                .filter(Objects::nonNull)
                .map(AcademicDepartment::getSchool)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(AcademicSchool::getName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(AcademicSchool::getCode, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(AcademicSchool::getId))
                .toList();

        List<AcademicDepartment> departments = eligibleCourses.stream()
                .map(Course::getSubject)
                .filter(Objects::nonNull)
                .map(AcademicSubject::getDepartment)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(AcademicDepartment::getName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(AcademicDepartment::getCode, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(AcademicDepartment::getId))
                .toList();

        List<AcademicSubject> subjects = eligibleCourses.stream()
                .map(Course::getSubject)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(AcademicSubject::getName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(AcademicSubject::getCode, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(AcademicSubject::getId))
                .toList();

        Map<Long, CourseVersion> currentVersionsByCourseId = courseVersionRepository.findCurrentCourseVersionsByCourseIds(
                        eligibleCourses.stream().map(Course::getId).toList()
                ).stream()
                .filter(courseVersion -> courseVersion.getCourse() != null && courseVersion.getCourse().getId() != null)
                .collect(Collectors.toMap(
                        courseVersion -> courseVersion.getCourse().getId(),
                        Function.identity(),
                        (left, right) -> left
                ));

        return new CoursePickerReferenceOptionsResponse(
                schools.stream()
                        .map(school -> new CodeNameReferenceOptionResponse(
                                school.getId(),
                                school.getCode(),
                                school.getName()
                        ))
                        .toList(),
                departments.stream()
                        .map(department -> new AcademicDepartmentReferenceOptionResponse(
                                department.getId(),
                                department.getCode(),
                                department.getName(),
                                department.getSchool() == null ? null : department.getSchool().getId()
                        ))
                        .toList(),
                subjects.stream()
                        .map(subject -> new AcademicSubjectReferenceOptionResponse(
                                subject.getId(),
                                subject.getCode(),
                                subject.getName(),
                                subject.getDepartment() == null ? null : subject.getDepartment().getId(),
                                subject.getDepartment() == null ? null : subject.getDepartment().getCode(),
                                subject.getDepartment() == null ? null : subject.getDepartment().getName()
                        ))
                        .toList(),
                eligibleCourses.stream()
                        .map(course -> toCourseReferenceOptionResponse(
                                course,
                                currentVersionsByCourseId.get(course.getId())
                        ))
                        .sorted(Comparator.comparing(CourseReferenceOptionResponse::schoolName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                                .thenComparing(CourseReferenceOptionResponse::departmentName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                                .thenComparing(CourseReferenceOptionResponse::subjectCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                                .thenComparing(CourseReferenceOptionResponse::courseNumber, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                                .thenComparing(CourseReferenceOptionResponse::courseId, Comparator.nullsLast(Long::compareTo)))
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

    @Transactional(readOnly = true)
    public CourseSectionReferenceOptionsResponse getCourseSectionReferenceOptions() {
        return new CourseSectionReferenceOptionsResponse(
                courseSectionStatusRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                academicDivisionRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                deliveryModeRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                gradingBasisRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                sectionMeetingTypeRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                sectionInstructorRoleRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                studentSectionEnrollmentStatusRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                studentSectionGradeTypeRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toCodeNameReferenceOptionResponse)
                        .toList(),
                gradeMarkRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(ReferenceDataService::toGradeMarkReferenceOptionResponse)
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
                academicSubTermRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(subTerm -> new AcademicSubTermReferenceOptionResponse(
                                subTerm.getId(),
                                subTerm.getCode(),
                                subTerm.getName(),
                                subTerm.getAcademicYear().getId(),
                                subTerm.getAcademicYear().getCode(),
                                subTerm.getAcademicYear().getName()
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
                academicSubTermStatusRepository.findAllByActiveTrueOrderByNameAsc().stream()
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
                academicSubTermRepository.findAllForStudentCatalogSearchOrderBySortOrderAsc().stream()
                        .map(subTerm -> new AcademicSubTermReferenceOptionResponse(
                                subTerm.getId(),
                                subTerm.getCode(),
                                subTerm.getName(),
                                subTerm.getAcademicYear().getId(),
                                subTerm.getAcademicYear().getCode(),
                                subTerm.getAcademicYear().getName()
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

    private List<Course> getEligibleCoursesForPicker() {
        List<Course> activeCourses = courseRepository.findAllByActiveTrue();
        if (activeCourses.isEmpty()) {
            return List.of();
        }

        List<Long> courseIds = activeCourses.stream()
                .map(Course::getId)
                .filter(Objects::nonNull)
                .toList();

        if (courseIds.isEmpty()) {
            return List.of();
        }

        java.util.Set<Long> courseIdsWithCurrentVersions = courseVersionRepository.findCurrentCourseVersionsByCourseIds(courseIds)
                .stream()
                .map(CourseVersion::getCourse)
                .filter(Objects::nonNull)
                .map(Course::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return activeCourses.stream()
                .filter(course -> courseIdsWithCurrentVersions.contains(course.getId()))
                .toList();
    }


    //TODO -- is there a better way? a place this belongs.
    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            AcademicDivision reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            CourseSectionStatus reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            DeliveryMode reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            GradingBasis reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            SectionMeetingType reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            SectionInstructorRole reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            StudentSectionEnrollmentStatus reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            StudentSectionGradeType reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            ProgramType reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            DegreeType reference
    ) {
        return new CodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    private static GradeMarkReferenceOptionResponse toGradeMarkReferenceOptionResponse(GradeMark gradeMark) {
        return new GradeMarkReferenceOptionResponse(
                gradeMark.getId(),
                gradeMark.getCode(),
                gradeMark.getName(),
                gradeMark.getQualityPoints(),
                gradeMark.isEarnsCredit(),
                gradeMark.isCountsInGpa()
        );
    }

    private CourseReferenceOptionResponse toCourseReferenceOptionResponse(
            Course course,
            CourseVersion currentCourseVersion
    ) {
        AcademicSubject subject = course.getSubject();
        AcademicDepartment department = subject == null ? null : subject.getDepartment();
        AcademicSchool school = department == null ? null : department.getSchool();

        //TODO this feels wrong / off.
        return new CourseReferenceOptionResponse(
                course.getId(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                subject == null ? null : subject.getId(),
                subject == null ? null : subject.getCode(),
                subject == null ? null : subject.getName(),
                course.getCourseNumber(),
                buildCourseCode(course),
                currentCourseVersion == null ? null : currentCourseVersion.getId(),
                currentCourseVersion == null ? null : currentCourseVersion.getTitle(),
                currentCourseVersion == null ? null : currentCourseVersion.getMinCredits(),
                currentCourseVersion == null ? null : currentCourseVersion.getMaxCredits(),
                currentCourseVersion != null && currentCourseVersion.isVariableCredit()
        );
    }

    private String buildCourseCode(Course course) {
        return course.getSubject() == null ? null : course.getSubject().getCode() + course.getCourseNumber();
    }
}
