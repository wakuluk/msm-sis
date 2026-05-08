package com.msm.sis.api.service.program;

import com.msm.sis.api.entity.Program;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.function.Function;

import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;

final class ProgramSearchSort {
    private ProgramSearchSort() {
    }

    static Comparator<Program> buildComparator(String sortBy, String sortDirection) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.ASC);
        String normalizedSortBy = normalizeSortBy(sortBy, "code");

        Comparator<Program> primaryComparator = switch (normalizedSortBy) {
            case "programTypeName" -> compareStrings(direction, program -> {
                return program.getProgramType() == null ? null : program.getProgramType().getName();
            });
            case "degreeTypeName" -> compareStrings(direction, program -> {
                return program.getDegreeType() == null ? null : program.getDegreeType().getName();
            });
            case "schoolName" -> compareStrings(direction, program -> {
                return program.getSchool() == null ? null : program.getSchool().getName();
            });
            case "departmentName" -> compareStrings(direction, program -> {
                return program.getDepartment() == null ? null : program.getDepartment().getName();
            });
            case "code" -> compareStrings(direction, Program::getCode);
            case "name" -> compareStrings(direction, Program::getName);
            case "createdAt" -> Comparator.comparing(
                    Program::getCreatedAt,
                    direction == Sort.Direction.ASC
                            ? Comparator.nullsLast(Comparator.naturalOrder())
                            : Comparator.nullsLast(Comparator.reverseOrder())
            );
            case "updatedAt" -> Comparator.comparing(
                    Program::getUpdatedAt,
                    direction == Sort.Direction.ASC
                            ? Comparator.nullsLast(Comparator.naturalOrder())
                            : Comparator.nullsLast(Comparator.reverseOrder())
            );
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: programTypeName, degreeTypeName, schoolName, departmentName, code, name, createdAt, updatedAt."
            );
        };

        return primaryComparator
                .thenComparing(compareStrings(Sort.Direction.ASC, Program::getCode))
                .thenComparing(Comparator.comparing(Program::getId, Comparator.nullsLast(Long::compareTo)));
    }

    private static Comparator<Program> compareStrings(
            Sort.Direction direction,
            Function<Program, String> valueExtractor
    ) {
        Comparator<String> stringComparator = Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
        if (direction == Sort.Direction.DESC) {
            stringComparator = stringComparator.reversed();
        }

        return Comparator.comparing(valueExtractor, stringComparator);
    }
}
