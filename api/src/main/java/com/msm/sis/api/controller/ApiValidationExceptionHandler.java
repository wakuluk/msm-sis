package com.msm.sis.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiValidationExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception
    ) {
        String message = exception.getBindingResult()
                .getAllErrors()
                .stream()
                .map(ObjectError::getDefaultMessage)
                .filter(currentMessage -> currentMessage != null && !currentMessage.isBlank())
                .findFirst()
                .orElse("Request validation failed.");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", message));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(
            ResponseStatusException exception
    ) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
        String message = exception.getReason();

        return ResponseEntity
                .status(status == null ? HttpStatus.INTERNAL_SERVER_ERROR : status)
                .body(Map.of(
                        "message",
                        message == null || message.isBlank() ? "Request failed." : message
                ));
    }
}
