package com.hospital.hms.controller;

import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.NotificationResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.service.NotificationService;
import com.hospital.hms.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications for the current user")
public class NotificationController {

    private final NotificationService notificationService;
    private final SecurityUtil securityUtil;

    @GetMapping
    @Operation(summary = "List notifications for the current user (paginated)")
    public ApiResponse<PageResponse<NotificationResponse>> getMyNotifications(Pageable pageable) {
        Long userId = requireCurrentUserId();
        return ApiResponse.success(PageResponse.of(notificationService.getForUser(userId, pageable)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get the current user's unread notification count")
    public ApiResponse<Long> getUnreadCount() {
        Long userId = requireCurrentUserId();
        return ApiResponse.success(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ApiResponse<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ApiResponse.message("Notification marked as read");
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all of the current user's notifications as read")
    public ApiResponse<Void> markAllAsRead() {
        Long userId = requireCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ApiResponse.message("All notifications marked as read");
    }

    private Long requireCurrentUserId() {
        Long userId = securityUtil.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("You must be logged in to view notifications");
        }
        return userId;
    }
}
