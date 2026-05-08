package com.msm.sis.api.service;

import com.msm.sis.api.dto.staff.StaffReferenceOptionResponse;
import com.msm.sis.api.dto.staff.StaffSearchResponse;
import com.msm.sis.api.entity.Staff;
import com.msm.sis.api.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class StaffService {
    private final StaffRepository staffRepository;

    @Transactional(readOnly = true)
    public StaffSearchResponse searchStaff(String search, int page, int size) {
        validatePageRequest(page, size, 25);

        Page<Staff> staffPage = staffRepository.searchStaff(
                trimToNull(search),
                PageRequest.of(
                        page,
                        size,
                        Sort.by(Sort.Direction.ASC, "lastName")
                                .and(Sort.by(Sort.Direction.ASC, "firstName"))
                                .and(Sort.by(Sort.Direction.ASC, "id"))
                )
        );

        return new StaffSearchResponse(
                staffPage.getContent().stream()
                        .map(this::toStaffReferenceOptionResponse)
                        .toList(),
                staffPage.getNumber(),
                staffPage.getSize(),
                staffPage.getTotalElements(),
                staffPage.getTotalPages()
        );
    }

    private StaffReferenceOptionResponse toStaffReferenceOptionResponse(Staff staff) {
        return new StaffReferenceOptionResponse(
                staff.getId(),
                staff.getFirstName(),
                staff.getLastName(),
                staff.getEmail(),
                buildDisplayName(staff)
        );
    }

    private String buildDisplayName(Staff staff) {
        String firstName = staff.getFirstName() == null ? "" : staff.getFirstName().trim();
        String lastName = staff.getLastName() == null ? "" : staff.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();

        return displayName.isBlank() ? staff.getEmail() : displayName;
    }
}
