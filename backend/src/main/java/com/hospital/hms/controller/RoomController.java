package com.hospital.hms.controller;

import com.hospital.hms.dto.request.RoomRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.RoomResponse;
import com.hospital.hms.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
@Tag(name = "Rooms", description = "Manage rooms and bed allocation")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a room")
    public ApiResponse<RoomResponse> create(@Valid @RequestBody RoomRequest request) {
        return ApiResponse.success("Room created successfully", roomService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    @Operation(summary = "Update a room")
    public ApiResponse<RoomResponse> update(@PathVariable Long id, @RequestBody RoomRequest request) {
        return ApiResponse.success("Room updated successfully", roomService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a room by id")
    public ApiResponse<RoomResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(roomService.getById(id));
    }

    @GetMapping
    @Operation(summary = "List all rooms")
    public ApiResponse<List<RoomResponse>> getAll() {
        return ApiResponse.success(roomService.getAll());
    }

    @GetMapping("/available")
    @Operation(summary = "List rooms with available beds")
    public ApiResponse<List<RoomResponse>> getAvailable() {
        return ApiResponse.success(roomService.getAvailable());
    }

    @PatchMapping("/{id}/allocate")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    @Operation(summary = "Allocate a bed in this room")
    public ApiResponse<RoomResponse> allocate(@PathVariable Long id) {
        return ApiResponse.success("Bed allocated", roomService.allocateBed(id));
    }

    @PatchMapping("/{id}/release")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    @Operation(summary = "Release a bed in this room")
    public ApiResponse<RoomResponse> release(@PathVariable Long id) {
        return ApiResponse.success("Bed released", roomService.releaseBed(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a room")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ApiResponse.message("Room deleted successfully");
    }
}
