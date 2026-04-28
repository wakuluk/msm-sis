package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Staff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    @Query("""
            select staff
            from Staff staff
            where :search is null
               or lower(staff.firstName) like lower(concat('%', :search, '%'))
               or lower(staff.lastName) like lower(concat('%', :search, '%'))
               or lower(staff.email) like lower(concat('%', :search, '%'))
               or lower(concat(staff.firstName, ' ', staff.lastName)) like lower(concat('%', :search, '%'))
            """)
    Page<Staff> searchStaff(
            @Param("search") String search,
            Pageable pageable
    );
}
