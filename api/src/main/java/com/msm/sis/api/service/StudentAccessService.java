package com.msm.sis.api.service;

import com.msm.sis.api.config.AuthenticatedUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentAccessService {

    private final StudentRepository studentRepository;

    public StudentAccessService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public Student getStudentById(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public Student getStudentProfile(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser.userId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return studentRepository.findByUserId(authenticatedUser.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
