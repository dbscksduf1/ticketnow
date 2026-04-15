package com.ticketing.concert.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seats", indexes = {
    @Index(name = "idx_concert_id", columnList = "concert_id"),
    @Index(name = "idx_concert_status", columnList = "concert_id, status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "concert_id", nullable = false)
    private Long concertId;

    @Column(name = "seat_row", nullable = false, length = 5)
    private String row;   // A, B, C...

    @Column(nullable = false)
    private int number;   // 1, 2, 3...

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;

    private int price;

    public void reserve() {
        if (this.status != Status.AVAILABLE) throw new IllegalStateException("이미 예약된 좌석입니다.");
        this.status = Status.RESERVED;
    }

    public void release() {
        this.status = Status.AVAILABLE;
    }

    public enum Grade { VIP, R, S, A }
    public enum Status { AVAILABLE, HELD, RESERVED }
}
