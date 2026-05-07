package com.msm.sis.api.service.student;

import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanDraftCourseRequest;
import com.msm.sis.api.dto.student.program.planner.ReplaceAcademicPlanPlaceholderCourseRequest;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanDraftRequest;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanDraftTermRequest;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanDraftYearRequest;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentAcademicPlan;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import com.msm.sis.api.entity.StudentAcademicPlanTerm;
import com.msm.sis.api.entity.StudentAcademicPlanYear;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.mapper.StudentProgramTrackerMapper;
import com.msm.sis.api.repository.AcademicDepartmentRepository;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.CourseVersionRepository;
import com.msm.sis.api.repository.RequirementRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentAcademicPlanCourseRepository;
import com.msm.sis.api.repository.StudentAcademicPlanRepository;
import com.msm.sis.api.repository.StudentAcademicPlanTermRepository;
import com.msm.sis.api.repository.StudentAcademicPlanYearRepository;
import com.msm.sis.api.repository.StudentProgramRepository;
import com.msm.sis.api.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentAcademicPlanService {
    private static final String DEFAULT_PLANNER_BUCKET_CODE = "FULL_TERM";
    private static final List<String> PLANNER_BUCKET_CODES = List.of(
            "FULL_TERM",
            "SESSION_A",
            "SESSION_B"
    );
    private static final List<String> DEFAULT_TERM_LABELS = List.of(
            "Fall",
            "Spring",
            "Summer I",
            "Summer II"
    );

    private final StudentRepository studentRepository;
    private final StudentAcademicPlanRepository studentAcademicPlanRepository;
    private final StudentProgramRepository studentProgramRepository;
    private final AcademicDepartmentRepository academicDepartmentRepository;
    private final CourseRepository courseRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final RequirementRepository requirementRepository;
    private final SisUserRepository sisUserRepository;
    private final StudentAcademicPlanYearRepository studentAcademicPlanYearRepository;
    private final StudentAcademicPlanTermRepository studentAcademicPlanTermRepository;
    private final StudentAcademicPlanCourseRepository studentAcademicPlanCourseRepository;
    private final StudentAcademicPlanWarningService studentAcademicPlanWarningService;
    private final StudentCompletedCourseTimelineService studentCompletedCourseTimelineService;
    private final StudentProgramTrackerMapper mapper;

    @Transactional
    public StudentAcademicPlan getOrCreateActivePlanEntity(Long studentId) {
        requirePositiveId(studentId, "Student id");
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));

        return studentAcademicPlanRepository.findActivePlanForStudent(studentId)
                .orElseGet(() -> createDefaultPlan(student));
    }

    @Transactional(readOnly = true)
    public StudentAcademicPlan getActivePlanOrDefaultProjection(Long studentId) {
        requirePositiveId(studentId, "Student id");
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));

        return studentAcademicPlanRepository.findActivePlanForStudent(studentId)
                .orElseGet(() -> buildDefaultPlanProjection(student));
    }

    @Transactional
    public StudentAcademicPlanResponse getOrCreateActivePlan(Long studentId) {
        StudentAcademicPlan academicPlan = getOrCreateActivePlanEntity(studentId);
        return toAcademicPlanResponse(studentId, academicPlan);
    }

    @Transactional
    public StudentAcademicPlanResponse savePlan(
            Long studentId,
            StudentAcademicPlanDraftRequest request,
            Long updatedByUserId
    ) {
        requirePositiveId(studentId, "Student id");
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic plan request is required.");
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        SisUser updatedByUser = resolveUpdatedByUser(updatedByUserId);
        StudentAcademicPlan academicPlan = resolvePlanForSave(student, request);

        academicPlan.setName(request.name().trim());
        academicPlan.setActive(true);
        academicPlan.setUpdatedByUser(updatedByUser);
        clearExistingPlanYears(academicPlan);
        request.years().forEach(yearRequest ->
                academicPlan.getYears().add(toYear(
                        academicPlan,
                        yearRequest,
                        student.getId(),
                        updatedByUser,
                        false,
                        null
                ))
        );

        StudentAcademicPlan savedPlan = studentAcademicPlanRepository.saveAndFlush(academicPlan);
        return toAcademicPlanResponse(student.getId(), savedPlan);
    }

    @Transactional
    public StudentAcademicPlanResponse replacePlaceholderCourseForAuthenticatedStudent(
            Long userId,
            Long studentAcademicPlanCourseId,
            ReplaceAcademicPlanPlaceholderCourseRequest request
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        return replacePlaceholderCourse(student.getId(), studentAcademicPlanCourseId, request, userId);
    }

    @Transactional
    public StudentAcademicPlanResponse replacePlaceholderCourse(
            Long studentId,
            Long studentAcademicPlanCourseId,
            ReplaceAcademicPlanPlaceholderCourseRequest request,
            Long updatedByUserId
    ) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(studentAcademicPlanCourseId, "Academic plan course id");
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Replacement course request is required.");
        }

        StudentAcademicPlanCourse planCourse = studentAcademicPlanCourseRepository
                .findPlanCourseForReplacement(studentAcademicPlanCourseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic plan course was not found."));
        StudentAcademicPlan academicPlan = academicPlanFor(planCourse);

        if (academicPlan.getStudent() == null || !studentId.equals(academicPlan.getStudent().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic plan course was not found.");
        }
        if (planCourse.getStudentAcademicPlanTerm() != null
                && planCourse.getStudentAcademicPlanTerm().isComplete()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed terms cannot be edited.");
        }
        if (planCourse.getCourse() != null || trimToNull(planCourse.getPlaceholderType()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic plan course is not a placeholder.");
        }

        Course course = resolveCourse(request.courseId());
        planCourse.setCourse(course);
        planCourse.setCredits(resolvePlannedCourseCredits(request.credits(), course, false));
        planCourse.setPlaceholderType(null);
        planCourse.setPlaceholderLabel(null);
        planCourse.setPlaceholderSubjectCode(null);
        planCourse.setPlaceholderDepartment(null);
        planCourse.setPlaceholderMinimumCourseNumber(null);
        planCourse.setPlaceholderMaximumCourseNumber(null);
        planCourse.setUpdatedByUser(resolveUpdatedByUser(updatedByUserId));

        StudentAcademicPlan savedPlan = studentAcademicPlanCourseRepository.saveAndFlush(planCourse)
                .getStudentAcademicPlanTerm()
                .getStudentAcademicPlanYear()
                .getStudentAcademicPlan();
        return toAcademicPlanResponse(studentId, savedPlan);
    }

    @Transactional
    public StudentAcademicPlanResponse savePlanForAuthenticatedStudent(
            Long userId,
            StudentAcademicPlanDraftRequest request
    ) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        return savePlan(student.getId(), request, userId);
    }

    private StudentAcademicPlanResponse toAcademicPlanResponse(
            Long studentId,
            StudentAcademicPlan academicPlan
    ) {
        return mapper.toStudentAcademicPlanResponse(
                academicPlan,
                studentAcademicPlanWarningService.buildWarnings(studentId, academicPlan),
                studentCompletedCourseTimelineService.getCompletedLocalCourseTimeline(studentId)
        );
    }

    @Transactional(readOnly = true)
    public StudentAcademicPlan buildDraftPlan(Long studentId, StudentAcademicPlanDraftRequest request) {
        requirePositiveId(studentId, "Student id");
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic plan request is required.");
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student was not found."));
        AtomicLong draftIdSequence = new AtomicLong(-1);

        StudentAcademicPlan academicPlan = new StudentAcademicPlan();
        academicPlan.setId(draftId(request.studentAcademicPlanId(), true, draftIdSequence));
        academicPlan.setStudent(student);
        academicPlan.setName(request.name().trim());
        academicPlan.setActive(true);
        request.years().forEach(yearRequest ->
                academicPlan.getYears().add(toYear(
                        academicPlan,
                        yearRequest,
                        student.getId(),
                        null,
                        true,
                        draftIdSequence
                ))
        );
        return academicPlan;
    }

    private StudentAcademicPlan academicPlanFor(StudentAcademicPlanCourse planCourse) {
        StudentAcademicPlanTerm term = planCourse.getStudentAcademicPlanTerm();
        StudentAcademicPlanYear year = term == null ? null : term.getStudentAcademicPlanYear();
        StudentAcademicPlan academicPlan = year == null ? null : year.getStudentAcademicPlan();
        if (academicPlan == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic plan course was not found.");
        }
        return academicPlan;
    }

    private void clearExistingPlanYears(StudentAcademicPlan academicPlan) {
        if (academicPlan.getId() != null) {
            studentAcademicPlanCourseRepository.deleteByStudentAcademicPlanId(academicPlan.getId());
            studentAcademicPlanTermRepository.deleteByStudentAcademicPlanId(academicPlan.getId());
            studentAcademicPlanYearRepository.deleteByStudentAcademicPlanId(academicPlan.getId());
            studentAcademicPlanYearRepository.flush();
        }
        academicPlan.getYears().clear();
    }

    private StudentAcademicPlan resolvePlanForSave(
            Student student,
            StudentAcademicPlanDraftRequest request
    ) {
        if (request.studentAcademicPlanId() == null) {
            return studentAcademicPlanRepository.findActivePlanForStudent(student.getId())
                    .orElseGet(() -> {
                        StudentAcademicPlan academicPlan = new StudentAcademicPlan();
                        academicPlan.setStudent(student);
                        return academicPlan;
                    });
        }

        StudentAcademicPlan academicPlan = studentAcademicPlanRepository.findById(request.studentAcademicPlanId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic plan was not found."));
        if (!student.getId().equals(academicPlan.getStudent().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic plan was not found.");
        }

        return academicPlan;
    }

    private StudentAcademicPlan createDefaultPlan(Student student) {
        StudentAcademicPlan academicPlan = buildDefaultPlan(student, null);
        return studentAcademicPlanRepository.saveAndFlush(academicPlan);
    }

    private StudentAcademicPlan buildDefaultPlanProjection(Student student) {
        return buildDefaultPlan(student, new AtomicLong(-1_000_000));
    }

    private StudentAcademicPlan buildDefaultPlan(
            Student student,
            AtomicLong projectionIdSequence
    ) {
        StudentAcademicPlan academicPlan = new StudentAcademicPlan();
        academicPlan.setId(nextProjectionId(projectionIdSequence));
        academicPlan.setStudent(student);
        academicPlan.setName("My Academic Plan");
        academicPlan.setActive(true);

        for (int index = 0; index < 4; index++) {
            StudentAcademicPlanYear year = new StudentAcademicPlanYear();
            year.setId(nextProjectionId(projectionIdSequence));
            year.setStudentAcademicPlan(academicPlan);
            year.setLabel("Year " + (index + 1));
            year.setSortOrder(index);
            year.setCanRemove(false);
            year.setTerms(buildDefaultTerms(year, projectionIdSequence));
            academicPlan.getYears().add(year);
        }

        return academicPlan;
    }

    private List<StudentAcademicPlanTerm> buildDefaultTerms(
            StudentAcademicPlanYear year,
            AtomicLong projectionIdSequence
    ) {
        return DEFAULT_TERM_LABELS.stream()
                .map(label -> {
                    StudentAcademicPlanTerm term = new StudentAcademicPlanTerm();
                    term.setId(nextProjectionId(projectionIdSequence));
                    term.setStudentAcademicPlanYear(year);
                    term.setLabel(label);
                    term.setSortOrder(DEFAULT_TERM_LABELS.indexOf(label));
                    term.setComplete(false);
                    return term;
                })
                .toList();
    }

    private Long nextProjectionId(AtomicLong projectionIdSequence) {
        return projectionIdSequence == null ? null : projectionIdSequence.getAndDecrement();
    }

    private StudentAcademicPlanYear toYear(
            StudentAcademicPlan academicPlan,
            StudentAcademicPlanDraftYearRequest request,
            Long studentId,
            SisUser updatedByUser,
            boolean preserveIds,
            AtomicLong draftIdSequence
    ) {
        StudentAcademicPlanYear year = new StudentAcademicPlanYear();
        year.setId(draftId(request.studentAcademicPlanYearId(), preserveIds, draftIdSequence));
        year.setStudentAcademicPlan(academicPlan);
        year.setLabel(request.label().trim());
        year.setSortOrder(request.sortOrder());
        year.setCanRemove(request.canRemove());
        year.setUpdatedByUser(updatedByUser);
        request.terms().forEach(termRequest ->
                year.getTerms().add(toTerm(
                        year,
                        termRequest,
                        studentId,
                        updatedByUser,
                        preserveIds,
                        draftIdSequence
                ))
        );
        return year;
    }

    private StudentAcademicPlanTerm toTerm(
            StudentAcademicPlanYear year,
            StudentAcademicPlanDraftTermRequest request,
            Long studentId,
            SisUser updatedByUser,
            boolean preserveIds,
            AtomicLong draftIdSequence
    ) {
        StudentAcademicPlanTerm term = new StudentAcademicPlanTerm();
        term.setId(draftId(request.studentAcademicPlanTermId(), preserveIds, draftIdSequence));
        term.setStudentAcademicPlanYear(year);
        term.setLabel(request.label().trim());
        term.setSortOrder(request.sortOrder());
        term.setComplete(request.complete());
        term.setUpdatedByUser(updatedByUser);
        request.courses().forEach(courseRequest ->
                term.getCourses().add(toCourse(
                        term,
                        courseRequest,
                        studentId,
                        updatedByUser,
                        preserveIds,
                        draftIdSequence
                ))
        );
        return term;
    }

    private StudentAcademicPlanCourse toCourse(
            StudentAcademicPlanTerm term,
            StudentAcademicPlanDraftCourseRequest request,
            Long studentId,
            SisUser updatedByUser,
            boolean preserveIds,
            AtomicLong draftIdSequence
    ) {
        validateCourseOrPlaceholder(request);
        Course course = resolveCourse(request.courseId());
        StudentProgram studentProgram = resolveStudentProgram(request.studentProgramId(), studentId);
        Requirement requirement = resolveRequirement(request.requirementId());
        AcademicDepartment placeholderDepartment = resolvePlaceholderDepartment(
                request.placeholderDepartmentId()
        );

        StudentAcademicPlanCourse planCourse = new StudentAcademicPlanCourse();
        planCourse.setId(draftId(request.studentAcademicPlanCourseId(), preserveIds, draftIdSequence));
        planCourse.setStudentAcademicPlanTerm(term);
        planCourse.setCourse(course);
        planCourse.setStudentProgram(studentProgram);
        planCourse.setRequirement(requirement);
        planCourse.setStatus("PLANNED");
        planCourse.setCredits(resolvePlannedCourseCredits(request.credits(), course, hasPlaceholder(request)));
        planCourse.setPlannerBucketCode(resolvePlannerBucketCode(request.plannerBucketCode()));
        planCourse.setPlannerBucketLabel(trimToNull(request.plannerBucketLabel()));
        planCourse.setPlaceholderType(trimToNull(request.placeholderType()));
        planCourse.setPlaceholderLabel(trimToNull(request.placeholderLabel()));
        planCourse.setPlaceholderSubjectCode(trimToNull(request.placeholderSubjectCode()));
        planCourse.setPlaceholderDepartment(placeholderDepartment);
        planCourse.setPlaceholderMinimumCourseNumber(request.placeholderMinimumCourseNumber());
        planCourse.setPlaceholderMaximumCourseNumber(request.placeholderMaximumCourseNumber());
        planCourse.setSortOrder(request.sortOrder());
        planCourse.setNotes(trimToNull(request.notes()));
        planCourse.setUpdatedByUser(updatedByUser);
        return planCourse;
    }

    private Long draftId(Long requestedId, boolean preserveIds, AtomicLong draftIdSequence) {
        if (!preserveIds) {
            return null;
        }

        if (requestedId != null && requestedId > 0) {
            return requestedId;
        }

        return draftIdSequence.getAndDecrement();
    }

    private void validateCourseOrPlaceholder(StudentAcademicPlanDraftCourseRequest request) {
        boolean hasCourse = request.courseId() != null;
        boolean hasPlaceholder = hasPlaceholder(request);

        if (hasCourse == hasPlaceholder) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Planned course must include either a course id or placeholder details."
            );
        }

        if (!hasPlaceholder) {
            return;
        }

        String placeholderType = trimToNull(request.placeholderType());
        String placeholderLabel = trimToNull(request.placeholderLabel());
        if (placeholderType == null || placeholderLabel == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Placeholder type and label are required."
            );
        }
        if (!List.of("DEPARTMENT_ELECTIVE", "ELECTIVE").contains(placeholderType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Placeholder type must be DEPARTMENT_ELECTIVE or ELECTIVE."
            );
        }
        if (request.placeholderMinimumCourseNumber() != null
                && request.placeholderMaximumCourseNumber() != null
                && request.placeholderMaximumCourseNumber() < request.placeholderMinimumCourseNumber()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Placeholder maximum course number must be greater than or equal to the minimum."
            );
        }
    }

    private Course resolveCourse(Long courseId) {
        if (courseId == null) {
            return null;
        }

        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course id is invalid."));
    }

    private BigDecimal resolvePlannedCourseCredits(
            BigDecimal requestedCredits,
            Course course,
            boolean placeholder
    ) {
        if (requestedCredits != null) {
            return requestedCredits;
        }

        if (placeholder) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Planned placeholder credits are required."
            );
        }

        if (course == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Planned course credits are required.");
        }

        return courseVersionRepository.findLatestCourseVersionByCourseId(course.getId())
                .map(CourseVersion::getMinCredits)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Planned course credits are required because the course has no version to infer from."
                ));
    }

    private String resolvePlannerBucketCode(String requestedBucketCode) {
        String bucketCode = trimToNull(requestedBucketCode);
        if (bucketCode == null) {
            return DEFAULT_PLANNER_BUCKET_CODE;
        }

        String normalizedBucketCode = bucketCode.toUpperCase();
        if (!PLANNER_BUCKET_CODES.contains(normalizedBucketCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Planner bucket code must be FULL_TERM, SESSION_A, or SESSION_B."
            );
        }

        return normalizedBucketCode;
    }

    private boolean hasPlaceholder(StudentAcademicPlanDraftCourseRequest request) {
        return trimToNull(request.placeholderType()) != null
                || trimToNull(request.placeholderLabel()) != null
                || trimToNull(request.placeholderSubjectCode()) != null
                || request.placeholderDepartmentId() != null
                || request.placeholderMinimumCourseNumber() != null
                || request.placeholderMaximumCourseNumber() != null;
    }

    private AcademicDepartment resolvePlaceholderDepartment(Long departmentId) {
        if (departmentId == null) {
            return null;
        }

        return academicDepartmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Placeholder department id is invalid."));
    }

    private StudentProgram resolveStudentProgram(Long studentProgramId, Long studentId) {
        if (studentProgramId == null) {
            return null;
        }

        StudentProgram studentProgram = studentProgramRepository.findById(studentProgramId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student program id is invalid."));
        if (studentProgram.getStudent() == null || !studentId.equals(studentProgram.getStudent().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student program id is invalid.");
        }

        return studentProgram;
    }

    private Requirement resolveRequirement(Long requirementId) {
        if (requirementId == null) {
            return null;
        }

        return requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement id is invalid."));
    }

    private SisUser resolveUpdatedByUser(Long updatedByUserId) {
        if (updatedByUserId == null) {
            return null;
        }

        return sisUserRepository.findById(updatedByUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Updated by user id is invalid."));
    }
}
