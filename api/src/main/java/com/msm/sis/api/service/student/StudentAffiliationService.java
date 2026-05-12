package com.msm.sis.api.service.student;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.student.affiliation.AddStudentAthleteRequest;
import com.msm.sis.api.dto.student.affiliation.PatchStudentAthleteRequest;
import com.msm.sis.api.dto.student.affiliation.StudentAffiliationSummaryResponse;
import com.msm.sis.api.dto.student.affiliation.StudentAthleteStatusResponse;
import com.msm.sis.api.dto.student.affiliation.StudentHonorsStatusResponse;
import com.msm.sis.api.dto.student.affiliation.UpdateStudentHonorsRequest;
import com.msm.sis.api.entity.AthleticSport;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentAthlete;
import com.msm.sis.api.entity.StudentHonors;
import com.msm.sis.api.repository.AthleticSportRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.StudentAthleteRepository;
import com.msm.sis.api.repository.StudentHonorsRepository;
import com.msm.sis.api.repository.StudentRepository;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

import static com.msm.sis.api.patch.PatchUtils.applyRequiredBoolean;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
public class StudentAffiliationService {

    private final StudentRepository studentRepository;
    private final StudentHonorsRepository studentHonorsRepository;
    private final StudentAthleteRepository studentAthleteRepository;
    private final AthleticSportRepository athleticSportRepository;
    private final SisUserRepository sisUserRepository;
    private final EntityManager entityManager;

    public StudentAffiliationService(
            StudentRepository studentRepository,
            StudentHonorsRepository studentHonorsRepository,
            StudentAthleteRepository studentAthleteRepository,
            AthleticSportRepository athleticSportRepository,
            SisUserRepository sisUserRepository,
            EntityManager entityManager
    ) {
        this.studentRepository = studentRepository;
        this.studentHonorsRepository = studentHonorsRepository;
        this.studentAthleteRepository = studentAthleteRepository;
        this.athleticSportRepository = athleticSportRepository;
        this.sisUserRepository = sisUserRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public StudentAffiliationSummaryResponse getStudentAffiliations(Long studentId) {
        Student student = getStudentEntity(studentId);
        return toSummaryResponse(student.getId());
    }

    @Transactional(readOnly = true)
    public StudentAffiliationSummaryResponse getStudentAffiliations(
            Long studentId,
            AuthenticatedJwt jwt
    ) {
        Student student = getStudentEntity(studentId);

        if (!isAdmin(jwt) && !Objects.equals(student.getUserId(), jwt == null ? null : jwt.getUserId())) {
            throw new AccessDeniedException("You do not have access to these student affiliations.");
        }

        return toSummaryResponse(student.getId());
    }

    @Transactional
    public StudentAffiliationSummaryResponse updateHonors(
            Long studentId,
            UpdateStudentHonorsRequest request,
            Long updatedByUserId
    ) {
        Student student = getStudentEntity(studentId);

        if (request.active() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Honors active flag is required.");
        }

        StudentHonors honors = studentHonorsRepository.findForStudent(student.getId())
                .orElseGet(() -> {
                    StudentHonors newHonors = new StudentHonors();
                    newHonors.setStudent(student);
                    return newHonors;
                });

        honors.setActive(request.active());
        honors.setUpdatedByUser(resolveUpdatedByUser(updatedByUserId));

        studentHonorsRepository.saveAndFlush(honors);
        entityManager.refresh(honors);

        return toSummaryResponse(student.getId());
    }

    @Transactional
    public StudentAffiliationSummaryResponse addAthlete(
            Long studentId,
            AddStudentAthleteRequest request,
            Long updatedByUserId
    ) {
        Student student = getStudentEntity(studentId);
        AthleticSport athleticSport = getAssignableSportEntity(request.athleticSportId());

        if (request.active() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athlete active flag is required.");
        }

        StudentAthlete athlete = studentAthleteRepository.findForStudentAndSport(student.getId(), athleticSport.getId())
                .orElseGet(() -> {
                    StudentAthlete newAthlete = new StudentAthlete();
                    newAthlete.setStudent(student);
                    newAthlete.setAthleticSport(athleticSport);
                    return newAthlete;
                });

        athlete.setActive(request.active());
        athlete.setUpdatedByUser(resolveUpdatedByUser(updatedByUserId));

        studentAthleteRepository.saveAndFlush(athlete);
        entityManager.refresh(athlete);

        return toSummaryResponse(student.getId());
    }

    @Transactional
    public StudentAffiliationSummaryResponse patchAthlete(
            Long studentId,
            Long studentAthleteId,
            PatchStudentAthleteRequest request,
            Long updatedByUserId
    ) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(studentAthleteId, "Student athlete id");

        StudentAthlete athlete = studentAthleteRepository.findForStudentAndId(studentId, studentAthleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        AthleticSport originalSport = athlete.getAthleticSport();
        AthleticSport patchedSport = originalSport;

        if (request.getAthleticSportId().isPresent()) {
            patchedSport = getAssignableSportEntity(request.getAthleticSportId().getValue());
            ensureSportIsNotAlreadyAttached(studentId, studentAthleteId, patchedSport.getId());
        }

        athlete.setAthleticSport(patchedSport);
        applyRequiredBoolean(request.getActive(), athlete::setActive, "Athlete active flag");

        if (hasAthleteChanges(athlete, originalSport, patchedSport) || request.getActive().isPresent()) {
            athlete.setUpdatedByUser(resolveUpdatedByUser(updatedByUserId));
            studentAthleteRepository.saveAndFlush(athlete);
            entityManager.refresh(athlete);
        }

        return toSummaryResponse(studentId);
    }

    private boolean hasAthleteChanges(
            StudentAthlete athlete,
            AthleticSport originalSport,
            AthleticSport patchedSport
    ) {
        return !Objects.equals(originalSport.getId(), patchedSport.getId())
                || athlete.getUpdatedByUser() == null;
    }

    private void ensureSportIsNotAlreadyAttached(Long studentId, Long studentAthleteId, Long athleticSportId) {
        studentAthleteRepository.findForStudentAndSport(studentId, athleticSportId)
                .filter(existing -> !Objects.equals(existing.getId(), studentAthleteId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Student already has an athlete status for this sport."
                    );
                });
    }

    private Student getStudentEntity(Long studentId) {
        requirePositiveId(studentId, "Student id");

        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private AthleticSport getAssignableSportEntity(Long athleticSportId) {
        requirePositiveId(athleticSportId, "Athletic sport id");

        AthleticSport athleticSport = athleticSportRepository.findById(athleticSportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport not found."));

        if (!athleticSport.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport is inactive.");
        }

        return athleticSport;
    }

    private SisUser resolveUpdatedByUser(Long updatedByUserId) {
        if (updatedByUserId == null) {
            return null;
        }

        return sisUserRepository.findById(updatedByUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Updated by user not found."));
    }

    private boolean isAdmin(AuthenticatedJwt jwt) {
        return jwt != null
                && jwt.getRoles() != null
                && jwt.getRoles().stream().anyMatch(role -> Objects.equals(role, "ADMIN"));
    }

    private StudentAffiliationSummaryResponse toSummaryResponse(Long studentId) {
        return new StudentAffiliationSummaryResponse(
                studentId,
                studentHonorsRepository.findForStudent(studentId)
                        .map(this::toHonorsResponse)
                        .orElse(null),
                studentAthleteRepository.findAllForStudent(studentId).stream()
                        .map(this::toAthleteResponse)
                        .toList()
        );
    }

    private StudentHonorsStatusResponse toHonorsResponse(StudentHonors honors) {
        SisUser updatedByUser = honors.getUpdatedByUser();

        return new StudentHonorsStatusResponse(
                honors.getId(),
                honors.getStudent().getId(),
                honors.isActive(),
                honors.getCreatedAt(),
                honors.getUpdatedAt(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail()
        );
    }

    private StudentAthleteStatusResponse toAthleteResponse(StudentAthlete athlete) {
        SisUser updatedByUser = athlete.getUpdatedByUser();
        AthleticSport athleticSport = athlete.getAthleticSport();

        return new StudentAthleteStatusResponse(
                athlete.getId(),
                athlete.getStudent().getId(),
                athleticSport.getId(),
                athleticSport.getCode(),
                athleticSport.getName(),
                athlete.isActive(),
                athlete.getCreatedAt(),
                athlete.getUpdatedAt(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail()
        );
    }
}
