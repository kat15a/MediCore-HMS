package com.hospital.hms.service;

import com.hospital.hms.dto.request.DoctorRequest;
import com.hospital.hms.dto.response.DoctorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DoctorService {

    DoctorResponse create(DoctorRequest request);

    DoctorResponse update(Long id, DoctorRequest request);

    DoctorResponse getById(Long id);

    DoctorResponse getByUserId(Long userId);

    Page<DoctorResponse> getAll(Pageable pageable);

    List<DoctorResponse> getByDepartment(Long departmentId);

    List<DoctorResponse> search(String keyword);

    void delete(Long id);

    void setAvailability(Long id, boolean available);
}
