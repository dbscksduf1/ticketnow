package com.ticketing.concert.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "concerts", indexes = {
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_date", columnList = "date"),
    @Index(name = "idx_category_date", columnList = "category, date")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Concert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String venue;

    @Column(nullable = false)
    private LocalDateTime date;

    private int duration; // 공연 시간(분)

    @Enumerated(EnumType.STRING)
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String posterUrl;
    private String organizer;
    private String ageLimit;
    private int price;       // 최저가

    @Column(nullable = false)
    private int totalSeats;

    @Column(nullable = false)
    private int availableSeats;

    public void decreaseAvailableSeats() {
        if (this.availableSeats <= 0) throw new IllegalStateException("남은 좌석이 없습니다.");
        this.availableSeats--;
    }

    public void increaseAvailableSeats() {
        this.availableSeats++;
    }

    public enum Category {
        콘서트, 뮤지컬, 스포츠, 전시
    }
}
