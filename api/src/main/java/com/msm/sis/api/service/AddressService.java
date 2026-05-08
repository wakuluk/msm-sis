package com.msm.sis.api.service;

import com.msm.sis.api.dto.student.CreateStudentRequest;
import com.msm.sis.api.dto.student.PatchStudentRequest;
import com.msm.sis.api.entity.Address;
import com.msm.sis.api.repository.AddressRepository;
import com.msm.sis.api.validation.AddressValidator;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

import static com.msm.sis.api.patch.PatchUtils.applyTrimmed;
import static com.msm.sis.api.util.TextUtils.trimToNull;

/**
 * Resolves address changes for student patch requests by reusing an existing
 * matching address row when possible and creating a new row only when needed.
 */
@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final AddressValidator addressValidator;

    public AddressService(AddressRepository addressRepository, AddressValidator addressValidator) {
        this.addressRepository = addressRepository;
        this.addressValidator = addressValidator;
    }

    /**
     * Returns true when the request includes any address field at all. This is a
     * presence check, not a comparison against the student's current address values.
     */
    public boolean hasAddressChanges(PatchStudentRequest request) {
        return request.getAddressLine1().isPresent()
                || request.getAddressLine2().isPresent()
                || request.getCity().isPresent()
                || request.getStateRegion().isPresent()
                || request.getPostalCode().isPresent()
                || request.getCountryCode().isPresent();
    }

    /**
     * Resolves an address snapshot from the create request. Blank address fields mean
     * the new student should start without an address reference.
     */
    public Address resolveAddress(CreateStudentRequest request, String updatedBy) {
        Address effectiveAddress = new Address();
        effectiveAddress.setAddressLine1(trimToNull(request.addressLine1()));
        effectiveAddress.setAddressLine2(trimToNull(request.addressLine2()));
        effectiveAddress.setCity(trimToNull(request.city()));
        effectiveAddress.setStateRegion(trimToNull(request.stateRegion()));
        effectiveAddress.setPostalCode(trimToNull(request.postalCode()));
        effectiveAddress.setCountryCode(trimToNull(request.countryCode()));
        return resolveAddress(effectiveAddress, updatedBy);
    }

    /**
     * Builds the effective address from the current address plus the incoming
     * patch fields, then returns a matching persisted address or saves a new one.
     */
    public Address resolveAddress(Address currentAddress, PatchStudentRequest request, String updatedBy) {
        // Start from the student's current address so omitted fields keep their old values.
        Address effectiveAddress = copyAddress(currentAddress);
        applyPatch(effectiveAddress, request);
        return resolveAddress(effectiveAddress, updatedBy);
    }

    /**
     * Resolves a fully materialized address snapshot to an existing row or a newly
     * persisted row after validation.
     */
    private Address resolveAddress(Address effectiveAddress, String updatedBy) {
        // A fully blank address means the student should no longer reference any address row.
        if (isEmpty(effectiveAddress)) {
            return null;
        }

        // New or partially patched addresses still need to satisfy required DB columns.
        addressValidator.validate(effectiveAddress);

        String lookupHash = buildLookupHash(effectiveAddress);
        effectiveAddress.setLookupHash(lookupHash);

        return addressRepository
                .findByLookupHash(lookupHash)
                .orElseGet(() -> {
                    effectiveAddress.setUpdatedBy(updatedBy);
                    return addressRepository.save(effectiveAddress);
                });
    }

    private void applyPatch(Address address, PatchStudentRequest request) {
        applyTrimmed(request.getAddressLine1(), address::setAddressLine1);
        applyTrimmed(request.getAddressLine2(), address::setAddressLine2);
        applyTrimmed(request.getCity(), address::setCity);
        applyTrimmed(request.getStateRegion(), address::setStateRegion);
        applyTrimmed(request.getPostalCode(), address::setPostalCode);
        applyTrimmed(request.getCountryCode(), address::setCountryCode);
    }

    /**
     * Treats a fully blank address snapshot as "no address" instead of inserting
     * an empty row into the address table.
     */
    private boolean isEmpty(Address address) {
        return trimToNull(address.getAddressLine1()) == null
                && trimToNull(address.getAddressLine2()) == null
                && trimToNull(address.getCity()) == null
                && trimToNull(address.getStateRegion()) == null
                && trimToNull(address.getPostalCode()) == null
                && trimToNull(address.getCountryCode()) == null;
    }

    /**
     * Copies the current persisted address into a detached object so the service can
     * compute the effective target address without mutating a shared row in place.
     */
    private Address copyAddress(Address currentAddress) {
        Address copiedAddress = new Address();
        if (currentAddress == null) {
            return copiedAddress;
        }

        copiedAddress.setAddressLine1(currentAddress.getAddressLine1());
        copiedAddress.setAddressLine2(currentAddress.getAddressLine2());
        copiedAddress.setCity(currentAddress.getCity());
        copiedAddress.setStateRegion(currentAddress.getStateRegion());
        copiedAddress.setPostalCode(currentAddress.getPostalCode());
        copiedAddress.setCountryCode(currentAddress.getCountryCode());
        copiedAddress.setLookupHash(currentAddress.getLookupHash());
        return copiedAddress;
    }

    private String buildLookupHash(Address address) {
        String normalizedAddress = String.join(
                "|",
                normalizeForLookup(address.getAddressLine1()),
                normalizeForLookup(address.getAddressLine2()),
                normalizeForLookup(address.getCity()),
                normalizeForLookup(address.getStateRegion()),
                normalizeForLookup(address.getPostalCode()),
                normalizeForLookup(address.getCountryCode())
        );

        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(normalizedAddress.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private String normalizeForLookup(String value) {
        String trimmedValue = trimToNull(value);
        if (trimmedValue == null) {
            return "<null>";
        }

        return trimmedValue
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT);
    }

}
