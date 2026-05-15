package com.msm.sis.api.dto.transfer;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record TransferRequestAttachmentResponse(
        Long transferRequestAttachmentId,
        Long transferRequestId,
        Long pdfDocumentId,
        String storageKey,
        String originalFileName,
        String attachmentType,
        Long uploadedByUserId,
        String uploadedByEmail,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime uploadedAt
) {
}
