package com.ticketing.reservation.dto;

import com.ticketing.reservation.entity.Reservation;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ReservationResponse {
    private Long id;
    private String reservationNumber;
    private Long concertId;
    private String concertTitle;
    private LocalDateTime concertDate;
    private String venue;
    private String seatRow;
    private int seatNumber;
    private String seatGrade;
    private int price;
    private String status;
    private LocalDateTime createdAt;

    public static ReservationResponse from(Reservation r) {
        ReservationResponse dto = new ReservationResponse();
        dto.id = r.getId();
        dto.reservationNumber = r.getReservationNumber();
        dto.concertId = r.getConcertId();
        dto.concertTitle = r.getConcertTitle();
        dto.concertDate = r.getConcertDate();
        dto.venue = r.getVenue();
        dto.seatRow = r.getSeatRow();
        dto.seatNumber = r.getSeatNumber();
        dto.seatGrade = r.getSeatGrade();
        dto.price = r.getPrice();
        dto.status = r.getStatus().name();
        dto.createdAt = r.getCreatedAt();
        return dto;
    }
}
