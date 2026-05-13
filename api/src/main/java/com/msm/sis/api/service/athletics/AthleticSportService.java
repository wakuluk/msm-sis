package com.msm.sis.api.service.athletics;

import com.msm.sis.api.dto.athletics.AthleticSportListResponse;
import com.msm.sis.api.dto.athletics.AthleticSportResponse;
import com.msm.sis.api.dto.athletics.CreateAthleticSportRequest;
import com.msm.sis.api.dto.athletics.PatchAthleticSportRequest;
import com.msm.sis.api.entity.AthleticSport;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.repository.AthleticSportRepository;
import com.msm.sis.api.repository.SisUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Objects;

import static com.msm.sis.api.patch.PatchUtils.applyRequiredBoolean;
import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
public class AthleticSportService {

    private final AthleticSportRepository athleticSportRepository;
    private final SisUserRepository sisUserRepository;

    public AthleticSportService(
            AthleticSportRepository athleticSportRepository,
            SisUserRepository sisUserRepository
    ) {
        this.athleticSportRepository = athleticSportRepository;
        this.sisUserRepository = sisUserRepository;
    }

    @Transactional(readOnly = true)
    public AthleticSportListResponse listSports() {
        return new AthleticSportListResponse(
                athleticSportRepository.findAllForManagement().stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @Transactional
    public AthleticSportResponse createSport(CreateAthleticSportRequest request, Long updatedByUserId) {
        String code = normalizeCode(request.code());
        String name = trimToNull(request.name());
        Boolean active = request.active();

        validateCreate(code, name, active);

        AthleticSport sport = new AthleticSport();
        sport.setCode(code);
        sport.setName(name);
        sport.setActive(active);
        sport.setUpdatedByUser(resolveUpdatedByUser(updatedByUserId));

        return toResponse(athleticSportRepository.save(sport));
    }

    @Transactional
    public AthleticSportResponse patchSport(
            Long athleticSportId,
            PatchAthleticSportRequest request,
            Long updatedByUserId
    ) {
        AthleticSport existingSport = getSportEntity(athleticSportId);
        AthleticSport candidateSport = copySport(existingSport);

        applyPatch(candidateSport, request);
        candidateSport.setCode(normalizeCode(candidateSport.getCode()));

        validatePatch(existingSport, candidateSport);

        if (!hasPatchableChanges(existingSport, candidateSport)) {
            return toResponse(existingSport);
        }

        copyPatchableFields(candidateSport, existingSport);
        existingSport.setUpdatedByUser(resolveUpdatedByUser(updatedByUserId));

        return toResponse(athleticSportRepository.save(existingSport));
    }

    private AthleticSport getSportEntity(Long athleticSportId) {
        if (athleticSportId == null || athleticSportId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport id must be a positive number.");
        }

        return athleticSportRepository.findById(athleticSportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private void applyPatch(AthleticSport sport, PatchAthleticSportRequest request) {
        applyTrimmed(request.getCode(), sport::setCode);
        applyTrimmed(request.getName(), sport::setName);
        applyRequiredBoolean(request.getActive(), sport::setActive, "Athletic sport active flag");
    }

    private void validateCreate(String code, String name, Boolean active) {
        validateRequiredFields(code, name, active);

        if (athleticSportRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport code already exists.");
        }

        if (athleticSportRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport name already exists.");
        }
    }

    private void validatePatch(AthleticSport existingSport, AthleticSport candidateSport) {
        String candidateCode = normalizeCode(candidateSport.getCode());
        String candidateName = trimToNull(candidateSport.getName());

        validateRequiredFields(
                candidateCode,
                candidateName,
                candidateSport.isActive()
        );

        if (!Objects.equals(existingSport.getCode(), candidateCode)
                && athleticSportRepository.existsByCodeAndIdNot(candidateCode, existingSport.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport code already exists.");
        }

        if (!Objects.equals(trimToNull(existingSport.getName()), candidateName)
                && athleticSportRepository.existsByNameIgnoreCaseAndIdNot(candidateName, existingSport.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport name already exists.");
        }

        candidateSport.setCode(candidateCode);
        candidateSport.setName(candidateName);
    }

    private void validateRequiredFields(String code, String name, Boolean active) {
        if (code == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport code is required.");
        }

        if (name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport name is required.");
        }

        if (active == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Athletic sport active flag is required.");
        }

        validateMaxLength(code, 30, "Athletic sport code");
        validateMaxLength(name, 255, "Athletic sport name");
    }

    private AthleticSport copySport(AthleticSport sport) {
        AthleticSport copy = new AthleticSport();
        copy.setId(sport.getId());
        copy.setCode(sport.getCode());
        copy.setName(sport.getName());
        copy.setActive(sport.isActive());
        copy.setUpdatedByUser(sport.getUpdatedByUser());
        return copy;
    }

    private void copyPatchableFields(AthleticSport source, AthleticSport target) {
        target.setCode(source.getCode());
        target.setName(source.getName());
        target.setActive(source.isActive());
    }

    private boolean hasPatchableChanges(AthleticSport existing, AthleticSport candidate) {
        return !Objects.equals(existing.getCode(), candidate.getCode())
                || !Objects.equals(trimToNull(existing.getName()), trimToNull(candidate.getName()))
                || existing.isActive() != candidate.isActive();
    }

    private SisUser resolveUpdatedByUser(Long updatedByUserId) {
        if (updatedByUserId == null) {
            return null;
        }

        return sisUserRepository.findById(updatedByUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Updated by user not found."));
    }

    private String normalizeCode(String code) {
        String trimmedCode = trimToNull(code);
        return trimmedCode == null ? null : trimmedCode.toUpperCase(Locale.US);
    }

    private AthleticSportResponse toResponse(AthleticSport sport) {
        SisUser updatedByUser = sport.getUpdatedByUser();

        return new AthleticSportResponse(
                sport.getId(),
                sport.getCode(),
                sport.getName(),
                sport.isActive(),
                sport.getCreatedAt(),
                sport.getUpdatedAt(),
                updatedByUser == null ? null : updatedByUser.getId(),
                updatedByUser == null ? null : updatedByUser.getEmail()
        );
    }
}
