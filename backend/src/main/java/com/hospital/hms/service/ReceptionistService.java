package com.hospital.hms.service;

import com.hospital.hms.dto.request.ReceptionistRequest;
import com.hospital.hms.dto.response.ReceptionistResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReceptionistService {

    ReceptionistResponse create(ReceptionistRequest request);

    ReceptionistResponse update(Long id, ReceptionistRequest request);

    ReceptionistResponse getById(Long id);

    Page<ReceptionistResponse> getAll(Pageable pageable);

    void delete(Long id);
}
