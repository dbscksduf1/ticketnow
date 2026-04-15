package com.ticketing.reservation.kafka;

import com.ticketing.reservation.entity.Reservation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 로컬 개발용 No-Op 이벤트 프로듀서
 * Kafka 없이 실행 가능 — Oracle Cloud 배포 시 KafkaReservationEventProducer로 교체
 */
@Slf4j
@Component
public class NoOpReservationEventProducer implements ReservationEventProducer {

    @Override
    public void sendReservationCompleted(Reservation reservation) {
        log.info("[NO-OP] 예매 완료 이벤트 (Kafka 미연결): reservationId={}, user={}",
                reservation.getId(), reservation.getUserId());
    }

    @Override
    public void sendReservationCancelled(Reservation reservation) {
        log.info("[NO-OP] 예매 취소 이벤트 (Kafka 미연결): reservationId={}, user={}",
                reservation.getId(), reservation.getUserId());
    }
}
