package com.msm.sis.api.dto.program;

import java.util.List;

public record ProgramSearchResponse(
        List<ProgramSearchResultResponse> results,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
