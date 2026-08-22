package com.hospital.hms.service;

import com.hospital.hms.dto.request.LaboratoryRequest;
import com.hospital.hms.dto.response.LaboratoryResponse;

import java.util.List;

public interface LaboratoryService {

    LaboratoryResponse create(LaboratoryRequest request);

    LaboratoryResponse update(Long id, LaboratoryRequest request);

    LaboratoryResponse getById(Long id);

    List<LaboratoryResponse> getAll();

    void delete(Long id);
}
