package com.rentsafe.repository;

import com.rentsafe.entity.Bill;
import com.rentsafe.entity.Bill.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface BillRepository extends JpaRepository<Bill, String> {

    // Find unit bills by status for notifications
    List<Bill> findByUnitIdAndStatus(String unitId, BillStatus status);

    // Find bills overdue
    List<Bill> findByStatusAndDueDateBefore(BillStatus status, LocalDate date);

    // Find bills by unit
    List<Bill> findByUnitId(String unitId);

    // Batch fetch bills for multiple units (for property dashboards)
    List<Bill> findByUnitIdIn(List<String> unitIds);

    @Query("SELECT b FROM Bill b JOIN b.unit u JOIN u.property pr WHERE pr.owner.id = :ownerId AND b.status = :paidStatus AND b.paidDate IS NOT NULL")
    List<Bill> findPaidBillsWithPaidDateForOwner(@Param("ownerId") String ownerId, @Param("paidStatus") BillStatus paidStatus);
}
