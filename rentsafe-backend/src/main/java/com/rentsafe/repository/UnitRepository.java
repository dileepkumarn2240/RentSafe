package com.rentsafe.repository;

import com.rentsafe.entity.Unit;
import com.rentsafe.entity.Unit.UnitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, String> {

    // Find units in a specific property
    List<Unit> findByPropertyId(String propertyId);

    // Find units by current tenant
    Optional<Unit> findByTenantId(String tenantId);

    // Filter units by status
    List<Unit> findByStatus(UnitStatus status);

    @Query("SELECT u FROM Unit u JOIN FETCH u.property p JOIN FETCH p.owner WHERE u.id = :id")
    Optional<Unit> findByIdWithPropertyAndOwner(@Param("id") String id);
}
