package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.RoomRequest;
import com.hospital.hms.dto.response.RoomResponse;
import com.hospital.hms.entity.Room;
import com.hospital.hms.entity.enums.RoomStatus;
import com.hospital.hms.entity.enums.RoomType;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.DuplicateResourceException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.RoomRepository;
import com.hospital.hms.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    @Override
    public RoomResponse create(RoomRequest request) {
        if (roomRepository.findByRoomNumber(request.getRoomNumber()).isPresent()) {
            throw new DuplicateResourceException("Room number '" + request.getRoomNumber() + "' already exists");
        }
        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .roomType(parseType(request.getRoomType()))
                .floor(request.getFloor())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 1)
                .occupiedBeds(0)
                .dailyRate(request.getDailyRate() != null ? request.getDailyRate() : BigDecimal.ZERO)
                .status(request.getStatus() != null ? parseStatus(request.getStatus()) : RoomStatus.AVAILABLE)
                .build();
        return toResponse(roomRepository.save(room));
    }

    @Override
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = findEntity(id);
        if (request.getRoomType() != null) room.setRoomType(parseType(request.getRoomType()));
        if (request.getFloor() != null) room.setFloor(request.getFloor());
        if (request.getCapacity() != null) room.setCapacity(request.getCapacity());
        if (request.getDailyRate() != null) room.setDailyRate(request.getDailyRate());
        if (request.getStatus() != null) room.setStatus(parseStatus(request.getStatus()));
        return toResponse(roomRepository.save(room));
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> getAll() {
        return roomRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> getAvailable() {
        return roomRepository.findByStatus(RoomStatus.AVAILABLE).stream()
                .filter(Room::hasAvailableBed)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RoomResponse allocateBed(Long id) {
        Room room = findEntity(id);
        if (!room.hasAvailableBed()) {
            throw new BadRequestException("Room " + room.getRoomNumber() + " has no available beds");
        }
        room.setOccupiedBeds(room.getOccupiedBeds() + 1);
        if (!room.hasAvailableBed()) {
            room.setStatus(RoomStatus.OCCUPIED);
        }
        return toResponse(roomRepository.save(room));
    }

    @Override
    public RoomResponse releaseBed(Long id) {
        Room room = findEntity(id);
        if (room.getOccupiedBeds() > 0) {
            room.setOccupiedBeds(room.getOccupiedBeds() - 1);
        }
        if (room.getStatus() == RoomStatus.OCCUPIED && room.hasAvailableBed()) {
            room.setStatus(RoomStatus.AVAILABLE);
        }
        return toResponse(roomRepository.save(room));
    }

    @Override
    public void delete(Long id) {
        roomRepository.delete(findEntity(id));
    }

    private Room findEntity(Long id) {
        return roomRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Room", id));
    }

    private RoomType parseType(String value) {
        try {
            return RoomType.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid room type: " + value);
        }
    }

    private RoomStatus parseStatus(String value) {
        try {
            return RoomStatus.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid room status: " + value);
        }
    }

    private RoomResponse toResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType().name())
                .floor(room.getFloor())
                .capacity(room.getCapacity())
                .occupiedBeds(room.getOccupiedBeds())
                .availableBeds(room.getCapacity() - room.getOccupiedBeds())
                .dailyRate(room.getDailyRate())
                .status(room.getStatus().name())
                .build();
    }
}
