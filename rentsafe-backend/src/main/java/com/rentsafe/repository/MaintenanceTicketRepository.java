package com.rentsafe.repository;

import com.rentsafe.entity.MaintenanceTicket;
import com.rentsafe.entity.MaintenanceTicket.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, String> {

    // Find tickets by tenant
    List<MaintenanceTicket> findByTenantId(String tenantId);

    // Find tickets by unit
    List<MaintenanceTicket> findByUnitId(String unitId);

    // Batch fetch tickets by unit IDs (for property dashboards)
    List<MaintenanceTicket> findByUnitIdIn(List<String> unitIds);

    // Find by status for dashboard
    List<MaintenanceTicket> findByStatus(TicketStatus status);
}
