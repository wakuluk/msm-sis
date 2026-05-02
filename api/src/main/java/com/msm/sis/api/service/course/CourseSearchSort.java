package com.msm.sis.api.service.course;

import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.Map;
import java.util.function.Function;

import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.TextUtils.normalizeSortBy;

final class CourseSearchSort {
    private CourseSearchSort() {
    }

    static Comparator<Course> buildComparator(
            String sortBy,
            String sortDirection,
            Map<Long, CourseVersion> currentVersionsByCourseId
    ) {
        Sort.Direction direction = parseDirection(sortDirection, Sort.Direction.DESC);
        String normalizedSortBy = normalizeSortBy(sortBy, "courseNumber");

        Comparator<Course> primaryComparator = switch (normalizedSortBy) {
            case "schoolCode" -> compareStrings(direction, course -> course.getSubject().getDepartment().getSchool().getCode());
            case "schoolName" -> compareStrings(direction, course -> course.getSubject().getDepartment().getSchool().getName());
            case "departmentCode" -> compareStrings(direction, course -> course.getSubject().getDepartment().getCode());
            case "departmentName" -> compareStrings(direction, course -> course.getSubject().getDepartment().getName());
            case "subjectCode" -> compareStrings(direction, course -> course.getSubject().getCode());
            case "subjectName" -> compareStrings(direction, course -> course.getSubject().getName());
            case "courseNumber" -> compareStrings(direction, Course::getCourseNumber);
            case "courseCode" -> compareStrings(direction, CourseSearchSort::buildCourseCode);
            case "title" -> compareStrings(direction, course -> {
                CourseVersion currentCourseVersion = currentVersionsByCourseId.get(course.getId());
                return currentCourseVersion == null ? null : currentCourseVersion.getTitle();
            });
            case "credits" -> compareBigDecimals(direction, course -> {
                CourseVersion currentCourseVersion = currentVersionsByCourseId.get(course.getId());
                return currentCourseVersion == null ? null : currentCourseVersion.getMinCredits();
            });
            case "active" -> Comparator.comparing(
                    Course::isActive,
                    direction == Sort.Direction.ASC ? Comparator.naturalOrder() : Comparator.reverseOrder()
            );
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: schoolCode, schoolName, departmentCode, departmentName, subjectCode, subjectName, courseNumber, courseCode, title, credits, active."
            );
        };

        return primaryComparator
                .thenComparing(compareStrings(Sort.Direction.ASC, CourseSearchSort::buildCourseCode))
                .thenComparing(Comparator.comparing(Course::getId, Comparator.nullsLast(Long::compareTo)));
    }

    private static Comparator<Course> compareStrings(
            Sort.Direction direction,
            Function<Course, String> valueExtractor
    ) {
        Comparator<String> stringComparator = Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
        if (direction == Sort.Direction.DESC) {
            stringComparator = stringComparator.reversed();
        }

        return Comparator.comparing(valueExtractor, stringComparator);
    }

    private static Comparator<Course> compareBigDecimals(
            Sort.Direction direction,
            Function<Course, BigDecimal> valueExtractor
    ) {
        Comparator<BigDecimal> bigDecimalComparator = Comparator.nullsLast(BigDecimal::compareTo);
        if (direction == Sort.Direction.DESC) {
            bigDecimalComparator = bigDecimalComparator.reversed();
        }

        return Comparator.comparing(valueExtractor, bigDecimalComparator);
    }

    private static String buildCourseCode(Course course) {
        if (course == null || course.getSubject() == null || course.getSubject().getCode() == null) {
            return null;
        }

        return course.getSubject().getCode() + course.getCourseNumber();
    }
}
