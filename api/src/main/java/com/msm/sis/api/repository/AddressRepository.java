package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    Optional<Address> findByLookupHash(String lookupHash);
}
