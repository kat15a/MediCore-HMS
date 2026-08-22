package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.DepartmentRequest;
import com.hospital.hms.dto.response.DepartmentResponse;
import com.hospital.hms.entity.Department;
import com.hospital.hms.exception.DuplicateResourceException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.DepartmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceImplTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DepartmentServiceImpl departmentService;

    private Department cardiology;

    @BeforeEach
    void setUp() {
        cardiology = Department.builder()
                .id(1L)
                .name("Cardiology")
                .description("Heart care")
                .isActive(true)
                .build();
    }

    @Test
    void create_savesDepartment_whenNameIsUnique() {
        DepartmentRequest request = DepartmentRequest.builder()
                .name("Cardiology")
                .description("Heart care")
                .build();

        when(departmentRepository.existsByNameIgnoreCase("Cardiology")).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenReturn(cardiology);
        when(doctorRepository.findByDepartment_Id(1L)).thenReturn(Collections.emptyList());

        DepartmentResponse response = departmentService.create(request);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Cardiology");
        assertThat(response.getDoctorCount()).isZero();
        verify(departmentRepository).save(any(Department.class));
    }

    @Test
    void create_throwsDuplicateResourceException_whenNameAlreadyExists() {
        DepartmentRequest request = DepartmentRequest.builder().name("Cardiology").build();
        when(departmentRepository.existsByNameIgnoreCase("Cardiology")).thenReturn(true);

        assertThatThrownBy(() -> departmentService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Cardiology");

        verify(departmentRepository, never()).save(any());
    }

    @Test
    void getById_throwsResourceNotFoundException_whenMissing() {
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> departmentService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getById_returnsMappedResponse_whenFound() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(cardiology));
        when(doctorRepository.findByDepartment_Id(1L)).thenReturn(Collections.emptyList());

        DepartmentResponse response = departmentService.getById(1L);

        assertThat(response.getName()).isEqualTo("Cardiology");
        assertThat(response.getIsActive()).isTrue();
    }

    @Test
    void update_allowsSavingWithSameName() {
        DepartmentRequest request = DepartmentRequest.builder()
                .name("Cardiology")
                .description("Updated description")
                .isActive(false)
                .build();

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(cardiology));
        when(departmentRepository.save(any(Department.class))).thenAnswer(inv -> inv.getArgument(0));
        when(doctorRepository.findByDepartment_Id(1L)).thenReturn(Collections.emptyList());

        DepartmentResponse response = departmentService.update(1L, request);

        assertThat(response.getDescription()).isEqualTo("Updated description");
        assertThat(response.getIsActive()).isFalse();
        // Renaming to the same (case-insensitive) name should never trigger the duplicate check.
        verify(departmentRepository, never()).existsByNameIgnoreCase(anyString());
    }

    @Test
    void update_throwsDuplicateResourceException_whenRenamingToAnExistingDepartment() {
        DepartmentRequest request = DepartmentRequest.builder().name("Neurology").build();
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(cardiology));
        when(departmentRepository.existsByNameIgnoreCase("Neurology")).thenReturn(true);

        assertThatThrownBy(() -> departmentService.update(1L, request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(departmentRepository, never()).save(any());
    }

    @Test
    void delete_removesDepartment_whenFound() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(cardiology));

        departmentService.delete(1L);

        verify(departmentRepository).delete(cardiology);
    }

    @Test
    void getAll_mapsEveryDepartment() {
        Department neurology = Department.builder().id(2L).name("Neurology").isActive(true).build();
        when(departmentRepository.findAll()).thenReturn(List.of(cardiology, neurology));
        when(doctorRepository.findByDepartment_Id(anyLong())).thenReturn(Collections.emptyList());

        List<DepartmentResponse> responses = departmentService.getAll();

        assertThat(responses).hasSize(2)
                .extracting(DepartmentResponse::getName)
                .containsExactlyInAnyOrder("Cardiology", "Neurology");
    }
}
