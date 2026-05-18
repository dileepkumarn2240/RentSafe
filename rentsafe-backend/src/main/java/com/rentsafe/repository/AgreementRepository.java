package com.rentsafe.repository;

import com.rentsafe.entity.Agreement;
import com.rentsafe.entity.Agreement.AgreementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AgreementRepository extends JpaRepository<Agreement, String> {

    // Agreements for a unit
    List<Agreement> findByUnitId(String unitId);

    // Find active agreements expiring before a date (for dashboard notifications)
    List<Agreement> findByStatusAndEndDateBefore(AgreementStatus status, LocalDate date);

    // Find by status
    List<Agreement> findByStatus(AgreementStatus status);
}
