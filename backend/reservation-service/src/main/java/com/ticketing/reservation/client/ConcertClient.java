package com.ticketing.reservation.client;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

/**
 * concert-service 내부 HTTP 호출 클라이언트
 */
@Component
@RequiredArgsConstructor
public class ConcertClient {

    private final RestTemplate restTemplate;

    @Value("${services.concert-url}")
    private String concertServiceUrl;

    public SeatReserveInfo reserveSeat(Long concertId, Long seatId) {
        String url = concertServiceUrl + "/api/concerts/" + concertId + "/seats/" + seatId + "/reserve";
        SeatReserveInfo body = restTemplate.exchange(url,
                org.springframework.http.HttpMethod.PUT,
                null,
                SeatReserveInfo.class).getBody();
        if (body == null) {
            throw new IllegalStateException("concert-service로부터 좌석 정보를 받지 못했습니다.");
        }
        return body;
    }

    public void releaseSeat(Long concertId, Long seatId) {
        String url = concertServiceUrl + "/api/concerts/" + concertId + "/seats/" + seatId + "/release";
        restTemplate.exchange(url,
                org.springframework.http.HttpMethod.PUT,
                null,
                Void.class);
    }

    @Getter
    public static class SeatReserveInfo {
        private String concertTitle;
        private LocalDateTime concertDate;
        private String venue;
        private String seatRow;
        private int seatNumber;
        private String seatGrade;
        private int price;
    }
}
