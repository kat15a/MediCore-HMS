package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.InventoryAdjustRequest;
import com.hospital.hms.dto.request.MedicineRequest;
import com.hospital.hms.dto.response.MedicineResponse;
import com.hospital.hms.entity.Inventory;
import com.hospital.hms.entity.Medicine;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.InventoryRepository;
import com.hospital.hms.repository.MedicineRepository;
import com.hospital.hms.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public MedicineResponse create(MedicineRequest request) {
        Medicine medicine = Medicine.builder()
                .name(request.getName())
                .genericName(request.getGenericName())
                .manufacturer(request.getManufacturer())
                .category(request.getCategory())
                .unit(request.getUnit())
                .unitPrice(request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO)
                .description(request.getDescription())
                .build();
        medicine = medicineRepository.save(medicine);

        Inventory inventory = Inventory.builder()
                .medicine(medicine)
                .quantityInStock(request.getInitialStock() != null ? request.getInitialStock() : 0)
                .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : 10)
                .batchNumber(request.getBatchNumber())
                .expiryDate(parseDate(request.getExpiryDate()))
                .lastRestockedAt(LocalDateTime.now())
                .build();
        inventoryRepository.save(inventory);

        return toResponse(medicine, inventory);
    }

    @Override
    public MedicineResponse update(Long id, MedicineRequest request) {
        Medicine medicine = findMedicine(id);
        if (request.getName() != null) medicine.setName(request.getName());
        if (request.getGenericName() != null) medicine.setGenericName(request.getGenericName());
        if (request.getManufacturer() != null) medicine.setManufacturer(request.getManufacturer());
        if (request.getCategory() != null) medicine.setCategory(request.getCategory());
        if (request.getUnit() != null) medicine.setUnit(request.getUnit());
        if (request.getUnitPrice() != null) medicine.setUnitPrice(request.getUnitPrice());
        if (request.getDescription() != null) medicine.setDescription(request.getDescription());
        medicine = medicineRepository.save(medicine);

        Inventory inventory = inventoryRepository.findByMedicine_Id(id).orElse(null);
        return toResponse(medicine, inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineResponse getById(Long id) {
        Medicine medicine = findMedicine(id);
        Inventory inventory = inventoryRepository.findByMedicine_Id(id).orElse(null);
        return toResponse(medicine, inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineResponse> getAll() {
        return medicineRepository.findAll().stream()
                .map(m -> toResponse(m, inventoryRepository.findByMedicine_Id(m.getId()).orElse(null)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineResponse> search(String name) {
        return medicineRepository.findByNameContainingIgnoreCase(name).stream()
                .map(m -> toResponse(m, inventoryRepository.findByMedicine_Id(m.getId()).orElse(null)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineResponse> getLowStock() {
        return inventoryRepository.findLowStockItems().stream()
                .map(inv -> toResponse(inv.getMedicine(), inv))
                .collect(Collectors.toList());
    }

    @Override
    public MedicineResponse adjustStock(Long medicineId, InventoryAdjustRequest request) {
        Medicine medicine = findMedicine(medicineId);
        Inventory inventory = inventoryRepository.findByMedicine_Id(medicineId)
                .orElseGet(() -> Inventory.builder().medicine(medicine).quantityInStock(0).reorderLevel(10).build());

        int newQuantity = inventory.getQuantityInStock() + request.getQuantity();
        if (newQuantity < 0) {
            throw new BadRequestException("Insufficient stock: only " + inventory.getQuantityInStock() + " units available");
        }
        inventory.setQuantityInStock(newQuantity);
        if (request.getBatchNumber() != null) inventory.setBatchNumber(request.getBatchNumber());
        if (request.getExpiryDate() != null) inventory.setExpiryDate(parseDate(request.getExpiryDate()));
        if (request.getQuantity() > 0) inventory.setLastRestockedAt(LocalDateTime.now());

        inventory = inventoryRepository.save(inventory);
        return toResponse(medicine, inventory);
    }

    @Override
    public void delete(Long id) {
        Medicine medicine = findMedicine(id);
        inventoryRepository.findByMedicine_Id(id).ifPresent(inventoryRepository::delete);
        medicineRepository.delete(medicine);
    }

    private Medicine findMedicine(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Medicine", id));
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid date format, expected yyyy-MM-dd: " + value);
        }
    }

    private MedicineResponse toResponse(Medicine medicine, Inventory inventory) {
        return MedicineResponse.builder()
                .id(medicine.getId())
                .name(medicine.getName())
                .genericName(medicine.getGenericName())
                .manufacturer(medicine.getManufacturer())
                .category(medicine.getCategory())
                .unit(medicine.getUnit())
                .unitPrice(medicine.getUnitPrice())
                .description(medicine.getDescription())
                .quantityInStock(inventory != null ? inventory.getQuantityInStock() : 0)
                .reorderLevel(inventory != null ? inventory.getReorderLevel() : 0)
                .lowStock(inventory != null && inventory.isLowStock())
                .expiryDate(inventory != null ? inventory.getExpiryDate() : null)
                .build();
    }
}
