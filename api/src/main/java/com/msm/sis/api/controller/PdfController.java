package com.msm.sis.api.controller;

import com.msm.sis.api.entity.PdfDocument;
import com.msm.sis.api.repository.PdfDocumentRepository;
import com.msm.sis.api.service.PdfStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/pdfs")
@Tag(name = "PDFs", description = "PDF document endpoints")
public class PdfController {

    private final PdfDocumentRepository pdfDocumentRepository;
    private final PdfStorageService pdfStorageService;

    public PdfController(
            PdfDocumentRepository pdfDocumentRepository,
            PdfStorageService pdfStorageService
    ) {
        this.pdfDocumentRepository = pdfDocumentRepository;
        this.pdfStorageService = pdfStorageService;
    }

    @GetMapping
    @Operation(summary = "List PDFs", description = "Returns all PDF document records")
    public ResponseEntity<List<PdfDocument>> listPdfs() {
        return ResponseEntity.ok(pdfDocumentRepository.findAll());
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download PDF", description = "Downloads a PDF document by id")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) throws IOException {
        PdfDocument pdfDocument = pdfDocumentRepository.findById(id).orElse(null);

        if (pdfDocument == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource;

        try {
            resource = pdfStorageService.loadAsResource(pdfDocument.getFilePath());
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(pdfDocument.getOriginalFileName())
                                .build()
                                .toString()
                )
                .body(resource);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload PDF", description = "Stores a PDF in file storage and creates a PDF document record")
    public ResponseEntity<PdfDocument> uploadPdf(@RequestParam("file") MultipartFile file) throws IOException {
        try {
            PdfStorageService.StoredPdf storedPdf = pdfStorageService.store(file);

            PdfDocument pdfDocument = new PdfDocument();
            pdfDocument.setFilePath(storedPdf.relativePath());
            pdfDocument.setOriginalFileName(storedPdf.originalFilename());

            PdfDocument savedDocument = pdfDocumentRepository.save(pdfDocument);
            return ResponseEntity.ok(savedDocument);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
