package com.msm.sis.api.service.academic;


import com.msm.sis.api.repository.AcademicYearRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AcademicValidationService {


/*
    For academic year:
        code is present
        name is present
        start date is present
        end date is present
        end is after start
        (terms do not need to be present on year create)>

    For term:
        code is present
        name is present
        start date is present
        end date is present
        sort order is present
        term and sort order should be unique within a year


        end is after start,
        falls within AcademicYear start and end date
        Should take in AcademicYearObject.

 */
}
