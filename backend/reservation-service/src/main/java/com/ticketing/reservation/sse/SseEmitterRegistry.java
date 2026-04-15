package com.ticketing.reservation.sse;

import com.ticketing.reservation.service.QueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * SSE Emitter 레지스트리
 *
 * - concertId → Set<EmitterEntry> 으로 관리
 * - Redis Pub/Sub 메시지 수신 시 해당 공연의 모든 구독자에게 Push
 * - CopyOnWriteArraySet: 이터레이션 중 동시 삭제 안전
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SseEmitterRegistry {

    private final ConcurrentHashMap<Long, CopyOnWriteArraySet<EmitterEntry>> emitters =
            new ConcurrentHashMap<>();

    public record EmitterEntry(Long userId, SseEmitter emitter) {}

    /**
     * 새 SSE 연결 등록
     */
    public void register(Long concertId, Long userId, SseEmitter emitter) {
        emitters.computeIfAbsent(concertId, k -> new CopyOnWriteArraySet<>())
                .add(new EmitterEntry(userId, emitter));
        log.debug("[SSE] 등록 concertId={} userId={} 현재 구독자={}", concertId, userId,
                emitters.get(concertId).size());
    }

    /**
     * SSE 연결 해제
     */
    public void remove(Long concertId, Long userId) {
        CopyOnWriteArraySet<EmitterEntry> set = emitters.get(concertId);
        if (set != null) {
            set.removeIf(e -> e.userId().equals(userId));
            log.debug("[SSE] 제거 concertId={} userId={} 남은 구독자={}", concertId, userId, set.size());
        }
    }

    /**
     * 해당 공연의 모든 구독자에게 대기열 상태 Push
     * - Redis Pub/Sub 메시지 수신 시 호출됨
     */
    public void broadcastUpdate(Long concertId, QueueService queueService) {
        CopyOnWriteArraySet<EmitterEntry> set = emitters.get(concertId);
        if (set == null || set.isEmpty()) return;

        long total = queueService.getTotal(concertId);
        Set<EmitterEntry> toRemove = new HashSet<>();

        for (EmitterEntry entry : set) {
            try {
                long rank = queueService.getRank(concertId, entry.userId());
                String status = rank <= 1 ? "READY" : "WAITING";
                String json = String.format(
                        "{\"rank\":%d,\"total\":%d,\"status\":\"%s\"}", rank, total, status);

                entry.emitter().send(SseEmitter.event().data(json));

                if ("READY".equals(status)) {
                    entry.emitter().complete();
                    toRemove.add(entry);
                }
            } catch (IOException e) {
                entry.emitter().completeWithError(e);
                toRemove.add(entry);
            }
        }

        set.removeAll(toRemove);
    }
}
