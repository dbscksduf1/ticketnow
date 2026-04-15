package com.ticketing.concert.repository;

import com.ticketing.concert.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByConcertId(Long concertId);
    Optional<Seat> findByConcertIdAndId(Long concertId, Long seatId);
}
