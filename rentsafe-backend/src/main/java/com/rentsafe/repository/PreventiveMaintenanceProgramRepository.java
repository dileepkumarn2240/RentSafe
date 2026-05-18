package com.rentsafe.repository;

import com.rentsafe.entity.MaintenanceIssueCategory;
import com.rentsafe.entity.PreventiveMaintenanceProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreventiveMaintenanceProgramRepository extends JpaRepository<PreventiveMaintenanceProgram, String> {

    @Query("SELECT p FROM PreventiveMaintenanceProgram p JOIN FETCH p.property pr JOIN FETCH pr.owner LEFT JOIN FETCH p.unit u WHERE pr.owner.id = :ownerId ORDER BY pr.name, u.name NULLS LAST, p.category")
    List<PreventiveMaintenanceProgram> findAllForOwner(@Param("ownerId") String ownerId);

    Optional<PreventiveMaintenanceProgram> findByIdAndProperty_Owner_Id(String id, String ownerId);

    Optional<PreventiveMaintenanceProgram> findByProperty_IdAndUnit_IdAndCategory(
            String propertyId, String unitId, MaintenanceIssueCategory category);

    Optional<PreventiveMaintenanceProgram> findByProperty_IdAndUnitIsNullAndCategory(
            String propertyId, MaintenanceIssueCategory category);
}
