package com.msm.sis.api.service.course;

import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseSectionGradePermissionService {
    private final CourseSectionInstructorRepository courseSectionInstructorRepository;

    public boolean canViewGrades(Long sectionId, Long userId, List<String> roles) {
        if (hasRole(roles, "ADMIN")) {
            return true;
        }

        if (sectionId == null || userId == null) {
            return false;
        }

        return courseSectionInstructorRepository.existsGradeViewAssignmentForInstructorUser(
                sectionId,
                userId
        );
    }

    public boolean canManageGrades(Long sectionId, Long userId, List<String> roles) {
        if (hasRole(roles, "ADMIN")) {
            return true;
        }

        if (sectionId == null || userId == null) {
            return false;
        }

        return courseSectionInstructorRepository.existsGradeManageAssignmentForInstructorUser(
                sectionId,
                userId
        );
    }

    public void assertCanViewGrades(Long sectionId, Long userId, List<String> roles) {
        if (!canViewGrades(sectionId, userId, roles)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User cannot view grades for this course section."
            );
        }
    }

    public void assertCanManageGrades(Long sectionId, Long userId, List<String> roles) {
        if (!canManageGrades(sectionId, userId, roles)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User cannot manage grades for this course section."
            );
        }
    }

    private boolean hasRole(List<String> roles, String expectedRole) {
        return roles != null && roles.stream().anyMatch(role -> expectedRole.equalsIgnoreCase(role));
    }
}
