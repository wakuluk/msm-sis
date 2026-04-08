package com.msm.sis.api.service;

import com.msm.sis.api.dto.CreateStudentRequest;
import com.msm.sis.api.dto.StudentProfileResponse;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.mapper.StudentMapper;
import com.msm.sis.api.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final StudentMapper studentMapper;

    public StudentService(StudentRepository studentRepository, StudentMapper studentMapper) {
        this.studentRepository = studentRepository;
        this.studentMapper = studentMapper;
    }

    public Student getStudentById(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public StudentProfileResponse getStudentProfile(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return studentMapper.toStudentProfileResponse(student);
    }

    public Student createStudent(CreateStudentRequest request) {
        Student student = studentMapper.fromCreateRequest(request);
        return studentRepository.save(student);
    }

    public List<Student> searchStudents(String nameQuery) {
        String trimmedNameQuery = trimToNull(nameQuery);
        if (trimmedNameQuery == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Last name is required.");
        }

        return studentRepository.findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(
                trimmedNameQuery,
                trimmedNameQuery
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }
}
