package com.hospital.hms.repository;

import com.hospital.hms.entity.Room;
import com.hospital.hms.entity.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);
    List<Room> findByStatus(RoomStatus status);

    long countByStatus(RoomStatus status);

    @Query("SELECT COALESCE(SUM(r.capacity - r.occupiedBeds), 0) FROM Room r WHERE r.status <> 'MAINTENANCE'")
    Long countAvailableBeds();

    @Query("SELECT COALESCE(SUM(r.capacity), 0) FROM Room r")
    Long countTotalBeds();
}
