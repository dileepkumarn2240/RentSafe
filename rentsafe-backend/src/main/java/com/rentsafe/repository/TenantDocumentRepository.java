package com.rentsafe.repository;

import com.rentsafe.entity.TenantDocument;
import com.rentsafe.entity.TenantDocument.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TenantDocumentRepository extends JpaRepository<TenantDocument, String> {

    // Documents by user and status
    List<TenantDocument> findByUserIdAndStatus(String userId, DocumentStatus status);

    // Check expiring documents
    List<TenantDocument> findByStatusAndUploadDateBefore(DocumentStatus status, LocalDate expiryEstimate);

    // Find unit-specific docs
    List<TenantDocument> findByUnitId(String unitId);

    // Find property-specific docs
    List<TenantDocument> findByPropertyId(String propertyId);

    // Documents by user
    List<TenantDocument> findByUserId(String userId);

    // Find documents by status
    List<TenantDocument> findByStatus(DocumentStatus status);

    // Grouping support
    List<TenantDocument> findByUserIdIn(List<String> userIds);
}
