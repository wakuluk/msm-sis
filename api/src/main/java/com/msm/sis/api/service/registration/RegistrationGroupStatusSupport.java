package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupStatusOptionResponse;

import java.util.List;
import java.util.Set;

final class RegistrationGroupStatusSupport {
    static final String DRAFT = "DRAFT";
    static final String PUBLISHED = "PUBLISHED";
    static final String CLOSED = "CLOSED";
    static final String CANCELLED = "CANCELLED";
    static final Set<String> ALLOWED_STATUSES = Set.of(DRAFT, PUBLISHED, CLOSED, CANCELLED);
    static final String ALLOWED_STATUS_MESSAGE = "Status must be one of: DRAFT, PUBLISHED, CLOSED, CANCELLED.";

    private RegistrationGroupStatusSupport() {
    }

    static boolean isAllowedStatus(String status) {
        return ALLOWED_STATUSES.contains(status);
    }

    static List<RegistrationGroupStatusOptionResponse> statusOptions() {
        return List.of(
                new RegistrationGroupStatusOptionResponse(DRAFT, "Draft"),
                new RegistrationGroupStatusOptionResponse(PUBLISHED, "Published"),
                new RegistrationGroupStatusOptionResponse(CLOSED, "Closed"),
                new RegistrationGroupStatusOptionResponse(CANCELLED, "Cancelled")
        );
    }

    static String statusName(String status) {
        if (status == null) {
            return null;
        }

        return switch (status) {
            case DRAFT -> "Draft";
            case PUBLISHED -> "Published";
            case CLOSED -> "Closed";
            case CANCELLED -> "Cancelled";
            default -> status;
        };
    }
}
