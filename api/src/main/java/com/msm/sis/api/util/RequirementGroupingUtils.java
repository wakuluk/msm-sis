package com.msm.sis.api.util;

import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class RequirementGroupingUtils {
    private RequirementGroupingUtils() {
    }

    public static List<Long> collectRequirementIds(
            Map<Long, List<ProgramVersionRequirement>> requirementsByVersionId
    ) {
        return requirementsByVersionId.values().stream()
                .flatMap(List::stream)
                .map(ProgramVersionRequirement::getRequirement)
                .filter(Objects::nonNull)
                .map(Requirement::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    public static Map<Long, List<RequirementCourse>> groupRequirementCoursesByRequirementId(
            List<RequirementCourse> requirementCourses
    ) {
        Map<Long, List<RequirementCourse>> requirementCoursesByRequirementId = new LinkedHashMap<>();
        requirementCourses.forEach(requirementCourse -> {
            Long requirementId = getRequirementId(requirementCourse);
            if (requirementId == null) {
                return;
            }

            requirementCoursesByRequirementId
                    .computeIfAbsent(requirementId, ignored -> new ArrayList<>())
                    .add(requirementCourse);
        });

        return requirementCoursesByRequirementId;
    }

    public static Map<Long, List<RequirementCourseRule>> groupRequirementCourseRulesByRequirementId(
            List<RequirementCourseRule> requirementCourseRules
    ) {
        Map<Long, List<RequirementCourseRule>> requirementCourseRulesByRequirementId = new LinkedHashMap<>();
        requirementCourseRules.forEach(requirementCourseRule -> {
            Long requirementId = getRequirementId(requirementCourseRule);
            if (requirementId == null) {
                return;
            }

            requirementCourseRulesByRequirementId
                    .computeIfAbsent(requirementId, ignored -> new ArrayList<>())
                    .add(requirementCourseRule);
        });

        return requirementCourseRulesByRequirementId;
    }

    private static Long getRequirementId(RequirementCourse requirementCourse) {
        if (requirementCourse.getRequirement() == null) {
            return null;
        }

        return requirementCourse.getRequirement().getId();
    }

    private static Long getRequirementId(RequirementCourseRule requirementCourseRule) {
        if (requirementCourseRule.getRequirement() == null) {
            return null;
        }

        return requirementCourseRule.getRequirement().getId();
    }
}
