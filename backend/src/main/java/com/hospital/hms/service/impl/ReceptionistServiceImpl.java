package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.ReceptionistRequest;
import com.hospital.hms.dto.response.ReceptionistResponse;
import com.hospital.hms.entity.Receptionist;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.entity.enums.Shift;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.DuplicateResourceException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.ReceptionistRepository;
import com.hospital.hms.repository.RoleRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.ReceptionistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReceptionistServiceImpl implements ReceptionistService {

    private final ReceptionistRepository receptionistRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ReceptionistResponse create(ReceptionistRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required to create a receptionist account");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("A user with email '" + request.getEmail() + "' already exists");
        }

        Role role = roleRepository.findByName(Role.RECEPTIONIST)
                .orElseThrow(() -> new IllegalStateException("RECEPTIONIST role is not seeded in the database"));

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : UUID.randomUUID().toString().substring(0, 12);

        User user = User.builder()
                .role(role)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .isActive(true)
                .isEmailVerified(true)
                .build();
        user = userRepository.save(user);

        Receptionist receptionist = Receptionist.builder()
                .user(user)
                .deskNumber(request.getDeskNumber())
                .shift(parseShift(request.getShift()))
                .build();

        return toResponse(receptionistRepository.save(receptionist));
    }

    @Override
    public ReceptionistResponse update(Long id, ReceptionistRequest request) {
        Receptionist receptionist = findEntity(id);

        if (request.getFirstName() != null) receptionist.getUser().setFirstName(request.getFirstName());
        if (request.getLastName() != null) receptionist.getUser().setLastName(request.getLastName());
        if (request.getPhone() != null) receptionist.getUser().setPhone(request.getPhone());
        if (request.getDeskNumber() != null) receptionist.setDeskNumber(request.getDeskNumber());
        if (request.getShift() != null) receptionist.setShift(parseShift(request.getShift()));

        return toResponse(receptionistRepository.save(receptionist));
    }

    @Override
    @Transactional(readOnly = true)
    public ReceptionistResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReceptionistResponse> getAll(Pageable pageable) {
        return receptionistRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public void delete(Long id) {
        Receptionist receptionist = findEntity(id);
        User user = receptionist.getUser();
        receptionistRepository.delete(receptionist);
        userRepository.delete(user);
    }

    private Receptionist findEntity(Long id) {
        return receptionistRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Receptionist", id));
    }

    private Shift parseShift(String value) {
        if (value == null || value.isBlank()) return Shift.MORNING;
        try {
            return Shift.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid shift value: " + value);
        }
    }

    private ReceptionistResponse toResponse(Receptionist receptionist) {
        User user = receptionist.getUser();
        return ReceptionistResponse.builder()
                .id(receptionist.getId())
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .deskNumber(receptionist.getDeskNumber())
                .shift(receptionist.getShift().name())
                .build();
    }
}
