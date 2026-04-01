package com.msm.sis.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Service
public class PdfStorageService {

    private final Path storageRoot;

    public PdfStorageService(@Value("${app.storage.root-dir:./uploads}") String storageRoot) {
        this.storageRoot = Path.of(storageRoot).toAbsolutePath().normalize();
    }

    public StoredPdf store(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        String originalFilename = file.getOriginalFilename();
        String normalizedFilename = originalFilename == null ? "" : originalFilename.trim().toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);

        if (!normalizedFilename.endsWith(".pdf") && !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed.");
        }

        Path pdfDirectory = storageRoot.resolve("pdf-documents");
        Files.createDirectories(pdfDirectory);

        String storedFilename = UUID.randomUUID() + ".pdf";
        Path destination = pdfDirectory.resolve(storedFilename).normalize();

        if (!destination.startsWith(pdfDirectory)) {
            throw new IOException("Invalid storage path.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        String relativePath = Path.of("pdf-documents", storedFilename)
                .toString()
                .replace('\\', '/');

        return new StoredPdf(relativePath, originalFilename == null || originalFilename.isBlank() ? storedFilename : originalFilename);
    }

    public Resource loadAsResource(String relativePath) throws IOException {
        Path resolvedPath = storageRoot.resolve(relativePath).normalize();

        if (!resolvedPath.startsWith(storageRoot)) {
            throw new IOException("Invalid storage path.");
        }

        Resource resource = new UrlResource(resolvedPath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new IOException("File not found.");
        }

        return resource;
    }

    public record StoredPdf(String relativePath, String originalFilename) {
    }
}
