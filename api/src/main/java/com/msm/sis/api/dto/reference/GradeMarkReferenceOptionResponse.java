package com.msm.sis.api.dto.reference;

import java.math.BigDecimal;

public record GradeMarkReferenceOptionResponse(
        Long id,
        String code,
        String name,
        BigDecimal qualityPoints,
        boolean earnsCredit,
        boolean countsInGpa
) {
}
