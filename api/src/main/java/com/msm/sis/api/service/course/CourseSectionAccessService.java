package com.msm.sis.api.service.course;

import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseSectionAccessService {
    private final CourseSectionInstructorRepository courseSectionInstructorRepository;

    public void assertCanViewSection(Long sectionId, Long userId, List<String> roles) {
        if (hasRole(roles, "ADMIN")) {
            return;
        }

        if (userId == null || !courseSectionInstructorRepository.existsAssignmentForInstructorUser(
                sectionId,
                userId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User cannot access this course section."
            );
        }
    }

    private boolean hasRole(List<String> roles, String expectedRole) {
        return roles != null && roles.stream().anyMatch(role -> expectedRole.equalsIgnoreCase(role));
    }
}
