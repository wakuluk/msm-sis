package com.msm.sis.api.validation;

import com.msm.sis.api.entity.Address;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

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

        validateMaxLength(address.getAddressLine1(), 255, "Address line 1");
        validateMaxLength(address.getAddressLine2(), 255, "Address line 2");
        validateMaxLength(address.getCity(), 100, "City");
        validateMaxLength(address.getStateRegion(), 100, "State/region");
        validateMaxLength(address.getPostalCode(), 20, "Postal code");
        validateMaxLength(address.getCountryCode(), 2, "Country code");
    }
}
