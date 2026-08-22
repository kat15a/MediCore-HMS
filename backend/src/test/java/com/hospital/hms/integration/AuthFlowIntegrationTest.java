package com.hospital.hms.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.hms.dto.request.LoginRequest;
import com.hospital.hms.dto.request.RegisterRequest;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.repository.RoleRepository;
import com.hospital.hms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Exercises the full stack for real — {@code SecurityConfig}, the JWT filter,
 * {@code GlobalExceptionHandler}, Hibernate/H2 — rather than mocking any layer.
 * This is the one test class that would catch a broken wiring between the
 * security filter chain, controller, and service that unit tests can't see.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;

    @BeforeEach
    void seedRoles() {
        // Flyway is disabled for the test profile (Hibernate owns the schema via ddl-auto),
        // so the roles Flyway would normally seed have to be inserted here instead.
        if (roleRepository.findByName(Role.PATIENT).isEmpty()) {
            roleRepository.save(Role.builder().name(Role.PATIENT).description("Patient").build());
        }
        if (roleRepository.findByName(Role.ADMIN).isEmpty()) {
            roleRepository.save(Role.builder().name(Role.ADMIN).description("Admin").build());
        }
    }

    @Test
    void fullAuthLifecycle_registerVerifyLoginAccessRefreshLogout() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Integration").lastName("Tester")
                .email("integration.test@example.com")
                .password("SecurePass123")
                .build();

        // 1. Register
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("integration.test@example.com"))
                .andExpect(jsonPath("$.data.isEmailVerified").value(false));

        // 2. Confirm login is rejected before verification
        LoginRequest loginRequest = LoginRequest.builder()
                .email("integration.test@example.com").password("SecurePass123").build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // 3. Verify email (reading the token straight from the DB, since no real SMTP runs in tests)
        User user = userRepository.findByEmail("integration.test@example.com").orElseThrow();
        assertThat(user.getEmailVerificationToken()).isNotBlank();

        mockMvc.perform(post("/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + user.getEmailVerificationToken() + "\"}"))
                .andExpect(status().isOk());

        // 4. Login now succeeds and returns a token pair
        String loginResponseJson = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String accessToken = objectMapper.readTree(loginResponseJson).path("data").path("accessToken").asText();
        String refreshToken = objectMapper.readTree(loginResponseJson).path("data").path("refreshToken").asText();

        // 5. Unauthenticated access to a protected endpoint is rejected
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());

        // 6. Authenticated access succeeds
        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("integration.test@example.com"));

        // 7. A patient cannot reach an admin-only endpoint
        mockMvc.perform(get("/dashboard/admin").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());

        // 8. Refresh rotates the token pair
        String refreshResponseJson = mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String newRefreshToken = objectMapper.readTree(refreshResponseJson).path("data").path("refreshToken").asText();
        assertThat(newRefreshToken).isNotEqualTo(refreshToken);

        // 9. The old refresh token is now revoked and can't be reused
        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());

        // 10. Logout revokes the current refresh token
        mockMvc.perform(post("/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefreshToken + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void register_rejectsDuplicateEmail_withConflictStatus() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("First").lastName("User")
                .email("duplicate@example.com").password("SecurePass123").build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("already exists")));
    }

    @Test
    void register_rejectsWeakPassword_withValidationError() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Weak").lastName("Password")
                .email("weak@example.com").password("short").build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors[0].field").value("password"));
    }
}
