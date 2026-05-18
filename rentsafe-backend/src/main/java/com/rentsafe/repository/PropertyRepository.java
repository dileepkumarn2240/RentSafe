package com.rentsafe.repository;

import com.rentsafe.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, String> {

    @Query("SELECT p FROM Property p LEFT JOIN FETCH p.units WHERE p.owner.id = :ownerId ORDER BY p.createdAt DESC")
    List<Property> findByOwnerIdOrderByCreatedAtDesc(@Param("ownerId") String ownerId);

    // For search/dashboard overviews if needed
    List<Property> findByAddressContainingIgnoreCase(String keyword);
}
