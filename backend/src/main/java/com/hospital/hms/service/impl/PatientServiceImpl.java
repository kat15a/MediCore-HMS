package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.PatientRequest;
import com.hospital.hms.dto.response.PatientResponse;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.entity.enums.Gender;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.DuplicateResourceException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.RoleRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PatientResponse register(PatientRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required to register a patient");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("A user with email '" + request.getEmail() + "' already exists");
        }

        Role patientRole = roleRepository.findByName(Role.PATIENT)
                .orElseThrow(() -> new IllegalStateException("PATIENT role is not seeded in the database"));

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : UUID.randomUUID().toString().substring(0, 12);

        User user = User.builder()
                .role(patientRole)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .gender(parseGender(request.getGender()))
                .dateOfBirth(parseDate(request.getDateOfBirth()))
                .isActive(true)
                .isEmailVerified(false)
                .build();
        user = userRepository.save(user);

        Patient patient = Patient.builder()
                .user(user)
                .bloodGroup(request.getBloodGroup())
                .heightCm(request.getHeightCm())
                .weightKg(request.getWeightKg())
                .address(request.getAddress())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .allergies(request.getAllergies())
                .chronicConditions(request.getChronicConditions())
                .insuranceProvider(request.getInsuranceProvider())
                .insurancePolicyNo(request.getInsurancePolicyNo())
                .build();

        return toResponse(patientRepository.save(patient));
    }

    @Override
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = findEntity(id);
        User user = patient.getUser();

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null) user.setGender(parseGender(request.getGender()));
        if (request.getDateOfBirth() != null) user.setDateOfBirth(parseDate(request.getDateOfBirth()));

        if (request.getBloodGroup() != null) patient.setBloodGroup(request.getBloodGroup());
        if (request.getHeightCm() != null) patient.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) patient.setWeightKg(request.getWeightKg());
        if (request.getAddress() != null) patient.setAddress(request.getAddress());
        if (request.getEmergencyContactName() != null) patient.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactPhone() != null) patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        if (request.getAllergies() != null) patient.setAllergies(request.getAllergies());
        if (request.getChronicConditions() != null) patient.setChronicConditions(request.getChronicConditions());
        if (request.getInsuranceProvider() != null) patient.setInsuranceProvider(request.getInsuranceProvider());
        if (request.getInsurancePolicyNo() != null) patient.setInsurancePolicyNo(request.getInsurancePolicyNo());

        return toResponse(patientRepository.save(patient));
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getByUserId(Long userId) {
        return patientRepository.findByUser_Id(userId)
                .map(this::toResponse)
                .orElseThrow(() -> ResourceNotFoundException.of("Patient profile for user", userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PatientResponse> getAll(Pageable pageable) {
        return patientRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientResponse> search(String keyword) {
        return patientRepository.search(keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Patient patient = findEntity(id);
        User user = patient.getUser();
        patientRepository.delete(patient);
        userRepository.delete(user);
    }

    private Patient findEntity(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", id));
    }

    private Gender parseGender(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Gender.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid gender value: " + value);
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid date format, expected yyyy-MM-dd: " + value);
        }
    }

    private PatientResponse toResponse(Patient patient) {
        User user = patient.getUser();
        return PatientResponse.builder()
                .id(patient.getId())
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .dateOfBirth(user.getDateOfBirth())
                .profileImageUrl(user.getProfileImageUrl())
                .bloodGroup(patient.getBloodGroup())
                .heightCm(patient.getHeightCm())
                .weightKg(patient.getWeightKg())
                .address(patient.getAddress())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .allergies(patient.getAllergies())
                .chronicConditions(patient.getChronicConditions())
                .insuranceProvider(patient.getInsuranceProvider())
                .insurancePolicyNo(patient.getInsurancePolicyNo())
                .build();
    }
}
