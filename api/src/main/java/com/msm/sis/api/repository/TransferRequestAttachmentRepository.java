package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferRequestAttachment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransferRequestAttachmentRepository extends JpaRepository<TransferRequestAttachment, Long> {

    @EntityGraph(attributePaths = {"pdfDocument", "uploadedByUser", "transferRequest"})
    Optional<TransferRequestAttachment> findByTransferRequestIdAndAttachmentType(
            Long transferRequestId,
            String attachmentType
    );

    boolean existsByTransferRequestIdAndAttachmentType(Long transferRequestId, String attachmentType);
}
