package com.hospital.hms.controller;

import com.hospital.hms.dto.request.*;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.AuthResponse;
import com.hospital.hms.dto.response.UserSummaryResponse;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.service.AuthService;
import com.hospital.hms.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, tokens, password reset, and email verification")
public class AuthController {

    private final AuthService authService;
    private final SecurityUtil securityUtil;

    @PostMapping("/register")
    @Operation(summary = "Self-register as a patient")
    public ApiResponse<UserSummaryResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(
                "Registration successful. Please check your email to verify your account.",
                authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Log in and receive an access + refresh token pair")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login successful", authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a valid refresh token for a new access token")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(authService.refresh(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke a refresh token (secure logout)")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ApiResponse.message("Logged out successfully");
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify an account using the token emailed at registration")
    public ApiResponse<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ApiResponse.message("Email verified successfully. You can now log in.");
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend the email verification link")
    public ApiResponse<Void> resendVerification(@RequestParam String email) {
        authService.resendVerificationEmail(email);
        return ApiResponse.message("Verification email sent");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset link")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.message("If that email exists, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset a password using a valid reset token")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.message("Password reset successfully. Please log in with your new password.");
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for the currently authenticated user")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Long userId = requireCurrentUserId();
        authService.changePassword(userId, request);
        return ApiResponse.message("Password changed successfully");
    }

    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user's profile summary")
    public ApiResponse<UserSummaryResponse> getCurrentUser() {
        Long userId = requireCurrentUserId();
        return ApiResponse.success(authService.getCurrentUser(userId));
    }

    private Long requireCurrentUserId() {
        Long userId = securityUtil.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("You must be logged in to perform this action");
        }
        return userId;
    }
}
