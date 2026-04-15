package com.ticketing.concert.dto;

import com.ticketing.concert.entity.Concert;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
public class ConcertResponse implements Serializable {

    private Long id;
    private String title;
    private String venue;
    private LocalDateTime date;
    private int duration;
    private String category;
    private String description;
    private String posterUrl;
    private String organizer;
    private String ageLimit;
    private int price;
    private int totalSeats;
    private int availableSeats;

    public static ConcertResponse from(Concert concert) {
        ConcertResponse dto = new ConcertResponse();
        dto.id = concert.getId();
        dto.title = concert.getTitle();
        dto.venue = concert.getVenue();
        dto.date = concert.getDate();
        dto.duration = concert.getDuration();
        dto.category = concert.getCategory() != null ? concert.getCategory().name() : null;
        dto.description = concert.getDescription();
        dto.posterUrl = concert.getPosterUrl();
        dto.organizer = concert.getOrganizer();
        dto.ageLimit = concert.getAgeLimit();
        dto.price = concert.getPrice();
        dto.totalSeats = concert.getTotalSeats();
        dto.availableSeats = concert.getAvailableSeats();
        return dto;
    }
}
