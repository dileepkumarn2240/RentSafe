package com.rentsafe.repository;

import com.rentsafe.entity.TenantHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TenantHistoryRepository extends JpaRepository<TenantHistory, String> {
    List<TenantHistory> findByUnitIdOrderByMovedOutDateDesc(String unitId);
}
