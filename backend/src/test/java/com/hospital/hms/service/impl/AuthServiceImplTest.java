package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.*;
import com.hospital.hms.dto.response.AuthResponse;
import com.hospital.hms.dto.response.UserSummaryResponse;
import com.hospital.hms.email.EmailService;
import com.hospital.hms.entity.RefreshToken;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.DuplicateResourceException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.repository.*;
import com.hospital.hms.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private ReceptionistRepository receptionistRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;

    private Role patientRole;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshTokenExpirationMs", 604_800_000L);
        patientRole = Role.builder().id(4L).name(Role.PATIENT).build();
    }

    @Test
    void register_createsUserAndPatientProfile_andSendsVerificationEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Jane").lastName("Doe").email("jane@example.com").password("password123").build();

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(roleRepository.findByName(Role.PATIENT)).thenReturn(Optional.of(patientRole));
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.empty());

        UserSummaryResponse response = authService.register(request);

        assertThat(response.getEmail()).isEqualTo("jane@example.com");
        assertThat(response.getRole()).isEqualTo(Role.PATIENT);
        assertThat(response.getIsEmailVerified()).isFalse();
        verify(patientRepository).save(any());
        verify(emailService).sendEmailVerification(eq("jane@example.com"), eq("Jane"), anyString());
    }

    @Test
    void register_throwsDuplicateResourceException_whenEmailAlreadyExists() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Jane").lastName("Doe").email("jane@example.com").password("password123").build();
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendEmailVerification(anyString(), anyString(), anyString());
    }

    @Test
    void login_throwsUnauthorizedException_whenEmailNotVerified() {
        User user = User.builder().id(1L).email("jane@example.com").isActive(true).isEmailVerified(false).role(patientRole).build();
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        LoginRequest request = LoginRequest.builder().email("jane@example.com").password("password123").build();

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("verify your email");

        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void login_throwsUnauthorizedException_whenAccountDeactivated() {
        User user = User.builder().id(1L).email("jane@example.com").isActive(false).isEmailVerified(true).role(patientRole).build();
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        LoginRequest request = LoginRequest.builder().email("jane@example.com").password("password123").build();

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void login_returnsTokens_onSuccessfulAuthentication() {
        User user = User.builder()
                .id(1L).firstName("Jane").lastName("Doe").email("jane@example.com")
                .isActive(true).isEmailVerified(true).role(patientRole).build();
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("access-token-123");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.empty());

        LoginRequest request = LoginRequest.builder().email("jane@example.com").password("password123").rememberMe(true).build();
        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access-token-123");
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getUser().getEmail()).isEqualTo("jane@example.com");
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void refresh_throwsUnauthorizedException_whenTokenExpired() {
        RefreshToken expired = RefreshToken.builder()
                .token("old-token").revoked(false).expiresAt(LocalDateTime.now().minusDays(1)).build();
        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(expired));

        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("old-token").build();

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void refresh_rotatesToken_revokingOldAndIssuingNew() {
        User user = User.builder().id(1L).firstName("Jane").lastName("Doe").email("jane@example.com").role(patientRole).build();
        RefreshToken oldToken = RefreshToken.builder()
                .id(1L).token("old-token").user(user).revoked(false).expiresAt(LocalDateTime.now().plusDays(1)).build();
        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(oldToken));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("new-access-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.empty());

        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("old-token").build();
        AuthResponse response = authService.refresh(request);

        assertThat(oldToken.getRevoked()).isTrue();
        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        assertThat(response.getRefreshToken()).isNotEqualTo("old-token");
    }

    @Test
    void resetPassword_throwsBadRequestException_whenTokenExpired() {
        User user = User.builder().id(1L).resetPasswordToken("tok").resetPasswordExpiresAt(LocalDateTime.now().minusHours(1)).build();
        when(userRepository.findByResetPasswordToken("tok")).thenReturn(Optional.of(user));

        ResetPasswordRequest request = ResetPasswordRequest.builder().token("tok").newPassword("newpass123").build();

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void resetPassword_updatesPasswordAndRevokesAllSessions_whenTokenValid() {
        User user = User.builder().id(1L).resetPasswordToken("tok").resetPasswordExpiresAt(LocalDateTime.now().plusMinutes(30)).build();
        when(userRepository.findByResetPasswordToken("tok")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpass123")).thenReturn("hashed-new");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ResetPasswordRequest request = ResetPasswordRequest.builder().token("tok").newPassword("newpass123").build();
        authService.resetPassword(request);

        assertThat(user.getPasswordHash()).isEqualTo("hashed-new");
        assertThat(user.getResetPasswordToken()).isNull();
        verify(refreshTokenRepository).revokeAllByUserId(1L);
    }

    @Test
    void changePassword_throwsBadRequestException_whenCurrentPasswordIncorrect() {
        User user = User.builder().id(1L).passwordHash("hashed-old").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed-old")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder().currentPassword("wrong").newPassword("newpass123").build();

        assertThatThrownBy(() -> authService.changePassword(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Current password is incorrect");

        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyEmail_activatesAccount_andClearsToken() {
        User user = User.builder().id(1L).isEmailVerified(false).emailVerificationToken("verify-tok").build();
        when(userRepository.findByEmailVerificationToken("verify-tok")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.verifyEmail(VerifyEmailRequest.builder().token("verify-tok").build());

        assertThat(user.getIsEmailVerified()).isTrue();
        assertThat(user.getEmailVerificationToken()).isNull();
    }
}
