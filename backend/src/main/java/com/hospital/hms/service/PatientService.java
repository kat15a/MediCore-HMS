package com.hospital.hms.service;

import com.hospital.hms.dto.request.PatientRequest;
import com.hospital.hms.dto.response.PatientResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PatientService {

    PatientResponse register(PatientRequest request);

    PatientResponse update(Long id, PatientRequest request);

    PatientResponse getById(Long id);

    PatientResponse getByUserId(Long userId);

    Page<PatientResponse> getAll(Pageable pageable);

    List<PatientResponse> search(String keyword);

    void delete(Long id);
}
