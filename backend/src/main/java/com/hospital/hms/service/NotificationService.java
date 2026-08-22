package com.hospital.hms.service;

import com.hospital.hms.dto.response.NotificationResponse;
import com.hospital.hms.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    /** Used internally by other services (appointments, billing, lab reports) to push an alert. */
    void notify(Long userId, String title, String message, NotificationType type);

    Page<NotificationResponse> getForUser(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId);

    void markAllAsRead(Long userId);
}
