package com.rentsafe.service;

import com.rentsafe.entity.Activity;
import com.rentsafe.entity.User;
import com.rentsafe.repository.ActivityRepository;
import com.rentsafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Activity> getActivitiesByUser(String userId) {
        return activityRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void logActivity(String userId, Activity.ActivityType type, String title, String description,
            String entityType, String entityId) {
        if (userId == null) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return;

        Activity activity = Activity.builder()
                .user(user)
                .type(type)
                .title(title)
                .description(description)
                .entityType(entityType)
                .entityId(entityId)
                .build();

        activityRepository.save(activity);
    }
}
