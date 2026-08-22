package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.LaboratoryRequest;
import com.hospital.hms.dto.response.LaboratoryResponse;
import com.hospital.hms.entity.Laboratory;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.LaboratoryRepository;
import com.hospital.hms.service.LaboratoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LaboratoryServiceImpl implements LaboratoryService {

    private final LaboratoryRepository laboratoryRepository;

    @Override
    public LaboratoryResponse create(LaboratoryRequest request) {
        Laboratory lab = Laboratory.builder()
                .testName(request.getTestName())
                .category(request.getCategory())
                .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                .description(request.getDescription())
                .build();
        return toResponse(laboratoryRepository.save(lab));
    }

    @Override
    public LaboratoryResponse update(Long id, LaboratoryRequest request) {
        Laboratory lab = findEntity(id);
        if (request.getTestName() != null) lab.setTestName(request.getTestName());
        if (request.getCategory() != null) lab.setCategory(request.getCategory());
        if (request.getPrice() != null) lab.setPrice(request.getPrice());
        if (request.getDescription() != null) lab.setDescription(request.getDescription());
        return toResponse(laboratoryRepository.save(lab));
    }

    @Override
    @Transactional(readOnly = true)
    public LaboratoryResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LaboratoryResponse> getAll() {
        return laboratoryRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        laboratoryRepository.delete(findEntity(id));
    }

    private Laboratory findEntity(Long id) {
        return laboratoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Laboratory test", id));
    }

    private LaboratoryResponse toResponse(Laboratory lab) {
        return LaboratoryResponse.builder()
                .id(lab.getId())
                .testName(lab.getTestName())
                .category(lab.getCategory())
                .price(lab.getPrice())
                .description(lab.getDescription())
                .build();
    }
}
