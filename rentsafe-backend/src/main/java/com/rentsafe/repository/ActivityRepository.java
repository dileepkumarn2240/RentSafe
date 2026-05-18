package com.rentsafe.repository;

import com.rentsafe.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, String> {
    List<Activity> findByUserIdOrderByCreatedAtDesc(String userId);
}
