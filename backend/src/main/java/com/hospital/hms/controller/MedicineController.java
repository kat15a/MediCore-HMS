package com.hospital.hms.controller;

import com.hospital.hms.dto.request.InventoryAdjustRequest;
import com.hospital.hms.dto.request.MedicineRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.MedicineResponse;
import com.hospital.hms.service.MedicineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medicines")
@RequiredArgsConstructor
@Tag(name = "Medicines & Inventory", description = "Manage medicine catalog and stock levels")
public class MedicineController {

    private final MedicineService medicineService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a medicine (optionally with initial stock)")
    public ApiResponse<MedicineResponse> create(@Valid @RequestBody MedicineRequest request) {
        return ApiResponse.success("Medicine added successfully", medicineService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a medicine")
    public ApiResponse<MedicineResponse> update(@PathVariable Long id, @RequestBody MedicineRequest request) {
        return ApiResponse.success("Medicine updated successfully", medicineService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a medicine by id")
    public ApiResponse<MedicineResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(medicineService.getById(id));
    }

    @GetMapping
    @Operation(summary = "List all medicines")
    public ApiResponse<List<MedicineResponse>> getAll() {
        return ApiResponse.success(medicineService.getAll());
    }

    @GetMapping("/search")
    @Operation(summary = "Search medicines by name")
    public ApiResponse<List<MedicineResponse>> search(@RequestParam String name) {
        return ApiResponse.success(medicineService.search(name));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List medicines at or below their reorder level")
    public ApiResponse<List<MedicineResponse>> getLowStock() {
        return ApiResponse.success(medicineService.getLowStock());
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Adjust stock (positive to restock, negative to deduct)")
    public ApiResponse<MedicineResponse> adjustStock(@PathVariable Long id, @Valid @RequestBody InventoryAdjustRequest request) {
        return ApiResponse.success("Stock updated successfully", medicineService.adjustStock(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a medicine")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        medicineService.delete(id);
        return ApiResponse.message("Medicine deleted successfully");
    }
}
