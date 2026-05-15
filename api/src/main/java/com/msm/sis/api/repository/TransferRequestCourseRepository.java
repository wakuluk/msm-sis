package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferRequestCourse;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TransferRequestCourseRepository extends JpaRepository<TransferRequestCourse, Long> {

    @EntityGraph(attributePaths = {"postedStudentTransferCredit"})
    List<TransferRequestCourse> findByTransferRequestIdOrderBySortOrderAscIdAsc(Long transferRequestId);

    @EntityGraph(attributePaths = {
            "transferRequest",
            "postedStudentTransferCredit"
    })
    @Query("""
            select transferRequestCourse
            from TransferRequestCourse transferRequestCourse
            where transferRequestCourse.transferRequest.id in :transferRequestIds
            order by transferRequestCourse.transferRequest.id asc,
                     transferRequestCourse.sortOrder asc,
                     transferRequestCourse.id asc
            """)
    List<TransferRequestCourse> findByTransferRequestIds(
            @Param("transferRequestIds") List<Long> transferRequestIds
    );
}
