package com.hospital.hms.service;

import com.hospital.hms.dto.request.*;
import com.hospital.hms.dto.response.AuthResponse;
import com.hospital.hms.dto.response.UserSummaryResponse;

public interface AuthService {

    /** Public self-registration. Always creates a PATIENT account and sends a verification email. */
    UserSummaryResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(String refreshToken);

    void verifyEmail(VerifyEmailRequest request);

    void resendVerificationEmail(String email);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);

    UserSummaryResponse getCurrentUser(Long userId);
}
