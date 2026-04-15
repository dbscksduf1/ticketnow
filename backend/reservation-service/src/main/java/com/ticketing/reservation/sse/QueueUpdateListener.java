package com.ticketing.reservation.sse;

import com.ticketing.reservation.service.QueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

/**
 * Redis Pub/Sub 구독자
 *
 * - 채널 패턴: queue:update:concert:{concertId}
 * - enterQueue / leaveQueue 호출 시 publish → 이 리스너가 수신
 * - 수신 즉시 해당 공연 구독자 전원에게 SSE Push (polling 불필요)
 *
 * 멀티 인스턴스 환경에서도 동작:
 *   instance-1 이 publish → Redis가 모든 instance의 리스너에게 전달
 *   → 각 instance가 자신의 SseEmitterRegistry를 통해 연결된 클라이언트에 Push
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QueueUpdateListener implements MessageListener {

    private final SseEmitterRegistry registry;
    private final QueueService queueService;

    @Override
    public void onMessage(@NonNull Message message, @Nullable byte[] pattern) {
        String channel = new String(message.getChannel()); // queue:update:concert:1
        try {
            String[] parts = channel.split(":");
            // 채널 형식: queue:update:concert:{concertId}
            if (parts.length < 4) return;
            Long concertId = Long.parseLong(parts[3]);
            log.debug("[Pub/Sub] 수신 channel={} concertId={}", channel, concertId);
            registry.broadcastUpdate(concertId, queueService);
        } catch (NumberFormatException e) {
            log.warn("[Pub/Sub] 잘못된 채널 형식: {}", channel);
        }
    }
}
