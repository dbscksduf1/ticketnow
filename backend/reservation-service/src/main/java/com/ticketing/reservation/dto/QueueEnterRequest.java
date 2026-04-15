package com.ticketing.reservation.dto;

import lombok.Getter;

@Getter
public class QueueEnterRequest {
    private Long concertId;
    private Long seatId;
    private String queueToken;
}
