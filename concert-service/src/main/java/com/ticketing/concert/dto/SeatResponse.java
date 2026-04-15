package com.ticketing.concert.dto;

import com.ticketing.concert.entity.Seat;
import lombok.Getter;

@Getter
public class SeatResponse {
    private Long id;
    private String row;
    private int number;
    private String grade;
    private String status;
    private int price;

    public static SeatResponse from(Seat seat) {
        SeatResponse dto = new SeatResponse();
        dto.id = seat.getId();
        dto.row = seat.getRow();
        dto.number = seat.getNumber();
        dto.grade = seat.getGrade().name();
        dto.status = seat.getStatus().name();
        dto.price = seat.getPrice();
        return dto;
    }
}
