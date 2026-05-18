package com.rentsafe.service;

import com.rentsafe.entity.Notification;
import com.rentsafe.entity.User;
import com.rentsafe.repository.NotificationRepository;
import com.rentsafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import com.rentsafe.entity.Unit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Notification> getNotificationsByUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void createNotification(String userId, Notification.NotificationType type, String title, String message,
            Notification.Urgency urgency) {
        if (userId == null) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return;

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .urgency(urgency)
                .build();

        notificationRepository.save(notification);
    }

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(String notificationId) {
        return notificationRepository.findById(notificationId).map(n -> {
            n.setIsRead(true);
            return notificationRepository.save(n);
        }).orElse(null);
    }

    public void sendPaymentReceiptEmailMock(Unit unit, String billType) {
        if (unit.getTenant() != null && unit.getTenant().getEmail() != null) {
            String tenantEmail = unit.getTenant().getEmail();
            logger.info("=====================================================");
            logger.info("EMAIL SENT TO: {}", tenantEmail);
            logger.info("SUBJECT: Payment Receipt Confirmation - {}", billType);
            logger.info("BODY: Dear {}, your {} payment for unit '{}' has been successfully processed and marked as PAID by your owner.", 
                    unit.getTenant().getFirstName(), billType, unit.getName());
            logger.info("=====================================================");
            
            Notification.NotificationType type = billType.contains("Rent") ? Notification.NotificationType.RENT : Notification.NotificationType.SYSTEM;
            // Also create an in-app notification
            createNotification(unit.getTenant().getId(), type, 
                "Payment Received: " + billType, 
                "Your owner has marked the " + billType + " payment for unit " + unit.getName() + " as PAID.", 
                Notification.Urgency.LOW);
        } else {
            logger.warn("Could not send email for {} in unit {} because tenant email is missing or unit is vacant.", billType, unit.getName());
        }
    }
}
