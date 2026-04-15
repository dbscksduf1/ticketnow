package com.ticketing.notification.kafka;

import com.ticketing.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 로컬 개발용 No-Op 컨슈머
 * Oracle Cloud 배포 시 @KafkaListener 활성화
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationEventConsumer {

    private final EmailService emailService;

    // Kafka 배포 시 아래 주석 해제
    // @KafkaListener(topics = "reservation.completed", groupId = "notification-group")
    public void handleReservationCompleted(Map<String, Object> event) {
        log.info("예매 완료 이벤트 수신: {}", event.get("reservationNumber"));
        try {
            emailService.sendReservationConfirm(event);
        } catch (Exception e) {
            log.error("예매 확인 이메일 발송 실패: {}", e.getMessage());
        }
    }

    // @KafkaListener(topics = "reservation.cancelled", groupId = "notification-group")
    public void handleReservationCancelled(Map<String, Object> event) {
        log.info("예매 취소 이벤트 수신: {}", event.get("reservationNumber"));
        try {
            emailService.sendReservationCancel(event);
        } catch (Exception e) {
            log.error("예매 취소 이메일 발송 실패: {}", e.getMessage());
        }
    }
}
