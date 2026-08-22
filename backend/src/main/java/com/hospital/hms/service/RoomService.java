package com.hospital.hms.service;

import com.hospital.hms.dto.request.RoomRequest;
import com.hospital.hms.dto.response.RoomResponse;

import java.util.List;

public interface RoomService {

    RoomResponse create(RoomRequest request);

    RoomResponse update(Long id, RoomRequest request);

    RoomResponse getById(Long id);

    List<RoomResponse> getAll();

    List<RoomResponse> getAvailable();

    RoomResponse allocateBed(Long id);

    RoomResponse releaseBed(Long id);

    void delete(Long id);
}
