package com.msm.sis.api.repository;

import com.msm.sis.api.entity.SisUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SisUserRepository extends JpaRepository<SisUser, Long> {
    Optional<SisUser> findByEmail(String email);
    boolean existsByEmail(String email);
}
