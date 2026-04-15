package com.ticketing.reservation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reservations", indexes = {
    @Index(name = "idx_user_id", columnList = "userId"),
    @Index(name = "idx_concert_seat", columnList = "concertId, seatId", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reservationNumber;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long concertId;

    @Column(nullable = false)
    private Long seatId;

    private String concertTitle;
    private LocalDateTime concertDate;
    private String venue;
    private String seatRow;
    private int seatNumber;
    private String seatGrade;
    private int price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Reservation(Long userId, Long concertId, Long seatId,
                        String concertTitle, LocalDateTime concertDate, String venue,
                        String seatRow, int seatNumber, String seatGrade, int price) {
        this.reservationNumber = "TN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.userId = userId;
        this.concertId = concertId;
        this.seatId = seatId;
        this.concertTitle = concertTitle;
        this.concertDate = concertDate;
        this.venue = venue;
        this.seatRow = seatRow;
        this.seatNumber = seatNumber;
        this.seatGrade = seatGrade;
        this.price = price;
        this.status = Status.CONFIRMED;
    }

    public void cancel() {
        if (this.status == Status.CANCELLED) throw new IllegalStateException("이미 취소된 예매입니다.");
        this.status = Status.CANCELLED;
    }

    public enum Status { CONFIRMED, CANCELLED, PENDING }
}
