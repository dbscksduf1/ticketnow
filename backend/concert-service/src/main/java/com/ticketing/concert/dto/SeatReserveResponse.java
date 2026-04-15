package com.ticketing.concert.dto;

import com.ticketing.concert.entity.Concert;
import com.ticketing.concert.entity.Seat;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SeatReserveResponse {
    private String concertTitle;
    private LocalDateTime concertDate;
    private String venue;
    private String seatRow;
    private int seatNumber;
    private String seatGrade;
    private int price;

    public static SeatReserveResponse from(Concert concert, Seat seat) {
        SeatReserveResponse dto = new SeatReserveResponse();
        dto.concertTitle = concert.getTitle();
        dto.concertDate  = concert.getDate();
        dto.venue        = concert.getVenue();
        dto.seatRow      = seat.getRow();
        dto.seatNumber   = seat.getNumber();
        dto.seatGrade    = seat.getGrade().name();
        dto.price        = seat.getPrice();
        return dto;
    }
}
