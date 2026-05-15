package com.msm.sis.api.service.transfer;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.transfer.TransferRequestAttachmentResponse;
import com.msm.sis.api.entity.PdfDocument;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.entity.TransferRequestAttachment;
import com.msm.sis.api.repository.PdfDocumentRepository;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.TransferRequestAttachmentRepository;
import com.msm.sis.api.repository.TransferRequestRepository;
import com.msm.sis.api.service.PdfStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class TransferRequestAttachmentService {

    private static final String ATTACHMENT_TYPE_TRANSCRIPT = "TRANSCRIPT";

    private final PdfDocumentRepository pdfDocumentRepository;
    private final PdfStorageService pdfStorageService;
    private final SisUserRepository sisUserRepository;
    private final TransferRequestAttachmentRepository transferRequestAttachmentRepository;
    private final TransferRequestRepository transferRequestRepository;

    @Transactional(readOnly = true)
    public TransferRequestAttachmentResponse getTranscriptAttachment(Long transferRequestId) {
        return mapAttachmentResponse(findTranscriptAttachment(transferRequestId));
    }

    @Transactional
    public TransferRequestAttachmentResponse uploadTranscriptAttachment(
            Long transferRequestId,
            MultipartFile file,
            AuthenticatedJwt jwt
    ) throws IOException {
        TransferRequest transferRequest = findTransferRequest(transferRequestId);
        return uploadTranscriptAttachment(transferRequest, file, jwt);
    }

    @Transactional
    public TransferRequestAttachmentResponse uploadCurrentStudentTranscriptAttachment(
            Long transferRequestId,
            MultipartFile file,
            AuthenticatedJwt jwt
    ) throws IOException {
        TransferRequest transferRequest = findTransferRequest(transferRequestId);
        if (transferRequest.getStudent() == null || !jwt.getUserId().equals(transferRequest.getStudent().getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found.");
        }

        return uploadTranscriptAttachment(transferRequest, file, jwt);
    }

    private TransferRequestAttachmentResponse uploadTranscriptAttachment(
            TransferRequest transferRequest,
            MultipartFile file,
            AuthenticatedJwt jwt
    ) throws IOException {
        SisUser uploadedByUser = findCurrentUser(jwt);

        PdfStorageService.StoredPdf storedPdf;
        try {
            storedPdf = pdfStorageService.store(file);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
        PdfDocument pdfDocument = new PdfDocument();
        pdfDocument.setFilePath(storedPdf.relativePath());
        pdfDocument.setOriginalFileName(storedPdf.originalFilename());
        PdfDocument savedPdfDocument = pdfDocumentRepository.save(pdfDocument);

        TransferRequestAttachment attachment = transferRequestAttachmentRepository
                .findByTransferRequestIdAndAttachmentType(transferRequest.getId(), ATTACHMENT_TYPE_TRANSCRIPT)
                .orElseGet(TransferRequestAttachment::new);
        attachment.setTransferRequest(transferRequest);
        attachment.setPdfDocument(savedPdfDocument);
        attachment.setStorageKey(savedPdfDocument.getFilePath());
        attachment.setAttachmentType(ATTACHMENT_TYPE_TRANSCRIPT);
        attachment.setUploadedByUser(uploadedByUser);
        attachment.setUploadedAt(LocalDateTime.now());

        return mapAttachmentResponse(transferRequestAttachmentRepository.save(attachment));
    }

    @Transactional(readOnly = true)
    public TransferRequestAttachmentDownload getTranscriptAttachmentDownload(Long transferRequestId) throws IOException {
        TransferRequestAttachment attachment = findTranscriptAttachment(transferRequestId);
        PdfDocument pdfDocument = attachment.getPdfDocument();
        Resource resource = pdfStorageService.loadAsResource(attachment.getStorageKey());

        return new TransferRequestAttachmentDownload(resource, pdfDocument.getOriginalFileName());
    }

    private TransferRequest findTransferRequest(Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");
        return transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
    }

    private TransferRequestAttachment findTranscriptAttachment(Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");
        return transferRequestAttachmentRepository
                .findByTransferRequestIdAndAttachmentType(transferRequestId, ATTACHMENT_TYPE_TRANSCRIPT)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer request transcript PDF was not found."
                ));
    }

    private SisUser findCurrentUser(AuthenticatedJwt jwt) {
        return sisUserRepository.findById(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user was not found."));
    }

    private TransferRequestAttachmentResponse mapAttachmentResponse(TransferRequestAttachment attachment) {
        SisUser uploadedByUser = attachment.getUploadedByUser();
        PdfDocument pdfDocument = attachment.getPdfDocument();

        return new TransferRequestAttachmentResponse(
                attachment.getId(),
                attachment.getTransferRequest().getId(),
                pdfDocument.getId(),
                attachment.getStorageKey(),
                pdfDocument.getOriginalFileName(),
                attachment.getAttachmentType(),
                uploadedByUser.getId(),
                uploadedByUser.getEmail(),
                attachment.getUploadedAt()
        );
    }

    public record TransferRequestAttachmentDownload(Resource resource, String originalFileName) {
    }
}
