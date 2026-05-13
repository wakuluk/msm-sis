package com.msm.sis.api.service.registration;

import java.util.List;

public record RegistrationGroupsPublishedEvent(List<Long> registrationGroupIds) {
}
