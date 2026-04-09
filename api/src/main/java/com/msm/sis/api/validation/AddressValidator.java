package com.msm.sis.api.validation;

import com.msm.sis.api.entity.Address;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import static com.msm.sis.api.util.TextUtils.trimToNull;

/**
 * Centralizes address validation so address field rules stay separate from the
 * resolve-or-create flow in AddressService.
 */
@Component
public class AddressValidator {

    public void validate(Address address) {
        if (trimToNull(address.getAddressLine1()) == null || trimToNull(address.getCity()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address line 1 and city are required.");
        }

        ValidationUtils.validateMaxLength(address.getAddressLine1(), 255, "Address line 1");
        ValidationUtils.validateMaxLength(address.getAddressLine2(), 255, "Address line 2");
        ValidationUtils.validateMaxLength(address.getCity(), 100, "City");
        ValidationUtils.validateMaxLength(address.getStateRegion(), 100, "State/region");
        ValidationUtils.validateMaxLength(address.getPostalCode(), 20, "Postal code");
        ValidationUtils.validateMaxLength(address.getCountryCode(), 2, "Country code");
        ValidationUtils.validateMaxLength(address.getAddressType(), 50, "Address type");
    }
}
