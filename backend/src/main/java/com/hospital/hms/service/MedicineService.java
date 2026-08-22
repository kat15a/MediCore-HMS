package com.hospital.hms.service;

import com.hospital.hms.dto.request.InventoryAdjustRequest;
import com.hospital.hms.dto.request.MedicineRequest;
import com.hospital.hms.dto.response.MedicineResponse;

import java.util.List;

public interface MedicineService {

    MedicineResponse create(MedicineRequest request);

    MedicineResponse update(Long id, MedicineRequest request);

    MedicineResponse getById(Long id);

    List<MedicineResponse> getAll();

    List<MedicineResponse> search(String name);

    List<MedicineResponse> getLowStock();

    MedicineResponse adjustStock(Long medicineId, InventoryAdjustRequest request);

    void delete(Long id);
}
