package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.*;
import com.hospital.hms.dto.response.AuthResponse;
import com.hospital.hms.dto.response.UserSummaryResponse;
import com.hospital.hms.email.EmailService;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.RefreshToken;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.DuplicateResourceException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.repository.*;
import com.hospital.hms.security.JwtTokenProvider;
import com.hospital.hms.security.UserPrincipal;
import com.hospital.hms.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ReceptionistRepository receptionistRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // A short-lived session (not "remember me") still gets a refresh token, just a shorter-lived one.
    private static final long SHORT_SESSION_REFRESH_MS = 24L * 60 * 60 * 1000; // 24 hours

    @Override
    public UserSummaryResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with email '" + request.getEmail() + "' already exists");
        }

        Role patientRole = roleRepository.findByName(Role.PATIENT)
                .orElseThrow(() -> new IllegalStateException("PATIENT role is not seeded in the database"));

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .role(patientRole)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .isEmailVerified(false)
                .emailVerificationToken(verificationToken)
                .build();
        user = userRepository.save(user);

        Patient patient = Patient.builder().user(user).build();
        patientRepository.save(patient);

        emailService.sendEmailVerification(user.getEmail(), user.getFirstName(), verificationToken);

        return toUserSummary(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("This account has been deactivated. Please contact support.");
        }
        if (!Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new UnauthorizedException("Please verify your email before logging in.");
        }

        // Delegates to CustomUserDetailsService + the configured PasswordEncoder;
        // throws BadCredentialsException (mapped to 401 by GlobalExceptionHandler) on mismatch.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = issueRefreshToken(user, request.isRememberMe());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(toUserSummary(user))
                .build();
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (Boolean.TRUE.equals(storedToken.getRevoked()) || storedToken.isExpired()) {
            throw new UnauthorizedException("Refresh token has expired or been revoked. Please log in again.");
        }

        User user = storedToken.getUser();
        UserPrincipal principal = new UserPrincipal(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(principal);

        // Rotate the refresh token: revoke the old one, issue a new one.
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);
        String newRefreshToken = issueRefreshToken(user, false);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(toUserSummary(user))
                .build();
    }

    @Override
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Override
    public void verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmailVerificationToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));
        user.setIsEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);
    }

    @Override
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ResourceNotFoundException.of("User", email));
        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BadRequestException("This email is already verified");
        }
        String token = UUID.randomUUID().toString();
        user.setEmailVerificationToken(token);
        userRepository.save(user);
        emailService.sendEmailVerification(user.getEmail(), user.getFirstName(), token);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        // Always behave the same way whether or not the email exists, to avoid leaking account existence.
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordExpiresAt(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            emailService.sendPasswordReset(user.getEmail(), user.getFirstName(), token);
        });
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getResetPasswordExpiresAt() == null || user.getResetPasswordExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiresAt(null);
        userRepository.save(user);

        // Reset password invalidates every existing session for safety.
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        return toUserSummary(user);
    }

    private String issueRefreshToken(User user, boolean rememberMe) {
        long ttl = rememberMe ? refreshTokenExpirationMs : SHORT_SESSION_REFRESH_MS;
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusNanos(ttl * 1_000_000))
                .revoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken).getToken();
    }

    private UserSummaryResponse toUserSummary(User user) {
        Long profileId = switch (user.getRole().getName()) {
            case Role.DOCTOR -> doctorRepository.findByUser_Id(user.getId()).map(d -> d.getId()).orElse(null);
            case Role.PATIENT -> patientRepository.findByUser_Id(user.getId()).map(p -> p.getId()).orElse(null);
            case Role.RECEPTIONIST -> receptionistRepository.findByUser_Id(user.getId()).map(r -> r.getId()).orElse(null);
            default -> null;
        };

        return UserSummaryResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .profileImageUrl(user.getProfileImageUrl())
                .isEmailVerified(user.getIsEmailVerified())
                .profileId(profileId)
                .build();
    }
}
