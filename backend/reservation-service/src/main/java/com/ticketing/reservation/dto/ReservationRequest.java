package com.ticketing.reservation.dto;

import lombok.Getter;

@Getter
public class ReservationRequest {
    private String queueToken;
    private Long concertId;
    private Long seatId;
}
