package com.rentsafe.repository;

import com.rentsafe.entity.Notification;
import com.rentsafe.entity.Notification.Urgency;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    // Filter by urgency for dashboard hub
    List<Notification> findByUserIdAndUrgency(String userId, Urgency urgency);

    // Pagination for notification history
    Page<Notification> findByUserId(String userId, Pageable pageable);
}
