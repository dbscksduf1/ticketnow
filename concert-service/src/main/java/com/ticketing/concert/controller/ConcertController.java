package com.ticketing.concert.controller;

import com.ticketing.concert.dto.ConcertResponse;
import com.ticketing.concert.dto.SeatReserveResponse;
import com.ticketing.concert.dto.SeatResponse;
import com.ticketing.concert.service.ConcertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concerts")
@RequiredArgsConstructor
public class ConcertController {

    private final ConcertService concertService;

    @GetMapping
    public ResponseEntity<List<ConcertResponse>> getConcerts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(concertService.getConcerts(category, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConcertResponse> getConcert(@PathVariable Long id) {
        return ResponseEntity.ok(concertService.getConcert(id));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<SeatResponse>> getSeats(@PathVariable Long id) {
        return ResponseEntity.ok(concertService.getSeats(id));
    }

    // reservation-service에서 내부 호출 — 좌석+공연 정보 반환
    @PutMapping("/{concertId}/seats/{seatId}/reserve")
    public ResponseEntity<SeatReserveResponse> reserveSeat(
            @PathVariable Long concertId,
            @PathVariable Long seatId) {
        return ResponseEntity.ok(concertService.decreaseAvailableSeats(concertId, seatId));
    }

    @PutMapping("/{concertId}/seats/{seatId}/release")
    public ResponseEntity<Void> releaseSeat(
            @PathVariable Long concertId,
            @PathVariable Long seatId) {
        concertService.increaseAvailableSeats(concertId, seatId);
        return ResponseEntity.ok().build();
    }
}
