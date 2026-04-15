package com.ticketing.reservation.service;

import com.ticketing.reservation.client.ConcertClient;
import com.ticketing.reservation.dto.ReservationRequest;
import com.ticketing.reservation.dto.ReservationResponse;
import com.ticketing.reservation.entity.Reservation;
import com.ticketing.reservation.kafka.ReservationEventProducer;
import com.ticketing.reservation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ConcertClient concertClient;
    private final ReservationEventProducer eventProducer;
    private final QueueService queueService;

    // Redis 분산락 키
    private static final String SEAT_LOCK_KEY = "lock:seat:";
    private static final long LOCK_TTL = 10L; // 10초

    /**
     * 예매 처리 (Redis 분산락으로 동시성 제어)
     *
     * 흐름:
     * 1. 대기열 토큰 검증
     * 2. Redis SETNX로 좌석 분산락 획득
     * 3. concert-service에 좌석 예약 요청
     * 4. DB에 예매 정보 저장
     * 5. Kafka로 예매 완료 이벤트 발행
     * 6. 락 해제 & 대기열 제거
     */
    @Transactional
    public ReservationResponse reserve(Long userId, ReservationRequest request) {
        String lockKey = SEAT_LOCK_KEY + request.getConcertId() + ":" + request.getSeatId();

        // 분산락 획득 시도 (SETNX)
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, String.valueOf(userId), Duration.ofSeconds(LOCK_TTL));

        if (!Boolean.TRUE.equals(acquired)) {
            throw new IllegalStateException("다른 사용자가 해당 좌석을 선택 중입니다. 잠시 후 다시 시도해주세요.");
        }

        try {
            // concert-service 좌석 예약 (내부 API 호출)
            var concertInfo = concertClient.reserveSeat(request.getConcertId(), request.getSeatId());

            Reservation reservation = Reservation.builder()
                    .userId(userId)
                    .concertId(request.getConcertId())
                    .seatId(request.getSeatId())
                    .concertTitle(concertInfo.getConcertTitle())
                    .concertDate(concertInfo.getConcertDate())
                    .venue(concertInfo.getVenue())
                    .seatRow(concertInfo.getSeatRow())
                    .seatNumber(concertInfo.getSeatNumber())
                    .seatGrade(concertInfo.getSeatGrade())
                    .price(concertInfo.getPrice())
                    .build();

            reservationRepository.save(reservation);

            // Kafka 이벤트 발행 (notification-service가 소비)
            eventProducer.sendReservationCompleted(reservation);

            // 대기열에서 제거
            queueService.leaveQueue(request.getConcertId(), userId);

            log.info("예매 완료 - userId: {}, reservationId: {}", userId, reservation.getId());
            return ReservationResponse.from(reservation);

        } finally {
            // 락 반드시 해제
            redisTemplate.delete(lockKey);
        }
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(Long userId) {
        return reservationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(ReservationResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public void cancel(Long userId, Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예매 정보를 찾을 수 없습니다."));

        if (!reservation.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 예매만 취소할 수 있습니다.");
        }

        reservation.cancel();

        // concert-service 좌석 복구
        concertClient.releaseSeat(reservation.getConcertId(), reservation.getSeatId());

        // Kafka 취소 이벤트
        eventProducer.sendReservationCancelled(reservation);

        log.info("예매 취소 - userId: {}, reservationId: {}", userId, reservationId);
    }
}
