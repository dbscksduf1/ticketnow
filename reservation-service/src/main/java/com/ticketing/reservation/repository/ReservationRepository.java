package com.ticketing.reservation.repository;

import com.ticketing.reservation.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByConcertIdAndSeatIdAndStatusNot(Long concertId, Long seatId, Reservation.Status status);
}
