package com.ticketing.reservation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Redis Sorted Set 기반 대기열 서비스
 *
 * - ZADD queue:concert:{concertId} {score} {userId}
 * - score = 현재 타임스탬프 (낮을수록 앞 순번)
 * - 프리미엄 회원: score에서 PREMIUM_PRIORITY 차감 → 2,000번 우선
 * - 대기열 토큰: 5분 TTL (이탈/브라우저 종료 시 자동 만료)
 * - enterQueue/leaveQueue 후 Pub/Sub publish → SSE 구독자 즉시 업데이트
 */
@Service
@RequiredArgsConstructor
public class QueueService {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${queue.premium-priority:2000}")
    private long premiumPriorityOffset;

    private static final String QUEUE_KEY            = "queue:concert:";
    private static final String QUEUE_TOKEN_KEY      = "queue:token:";
    private static final String QUEUE_UPDATE_CHANNEL = "queue:update:concert:";
    private static final Duration TOKEN_TTL          = Duration.ofMinutes(5);

    public record TokenInfo(Long concertId, Long userId) {}

    /**
     * 대기열 진입 — 토큰 발급 (TTL 5분) + 구독자에게 Push
     */
    public String enterQueue(Long concertId, Long userId, boolean isPremium) {
        String queueKey = QUEUE_KEY + concertId;
        long score = System.currentTimeMillis();

        if (isPremium) {
            score = Math.max(0, score - (premiumPriorityOffset * 1000L));
        }

        redisTemplate.opsForZSet().add(queueKey, String.valueOf(userId), score);

        String token = UUID.randomUUID().toString();
        // TTL 설정 → 브라우저 이탈 시 토큰 자동 만료 (메모리 누수 방지)
        redisTemplate.opsForValue().set(
            QUEUE_TOKEN_KEY + token,
            concertId + ":" + userId,
            TOKEN_TTL
        );

        // 대기열 변동 → 모든 SSE 구독자에게 즉시 알림
        publishUpdate(concertId);

        return token;
    }

    /**
     * 현재 대기 순번 조회 (1-based, -1이면 대기열에 없음)
     */
    public long getRank(Long concertId, Long userId) {
        Long rank = redisTemplate.opsForZSet().rank(
            QUEUE_KEY + concertId, String.valueOf(userId)
        );
        return rank == null ? -1L : rank + 1L;
    }

    /**
     * 전체 대기 인원 수
     */
    public long getTotal(Long concertId) {
        Long size = redisTemplate.opsForZSet().size(QUEUE_KEY + concertId);
        return size == null ? 0L : size;
    }

    /**
     * 대기열에서 제거 (입장 완료 or 취소) + 구독자에게 Push
     */
    public void leaveQueue(Long concertId, Long userId) {
        redisTemplate.opsForZSet().remove(QUEUE_KEY + concertId, String.valueOf(userId));
        publishUpdate(concertId);
    }

    /**
     * 토큰 파싱 — 타입 안전한 record 반환
     */
    public TokenInfo getTokenInfo(String token) {
        String data = redisTemplate.opsForValue().get(QUEUE_TOKEN_KEY + token);
        if (data == null) return null;
        String[] parts = data.split(":");
        if (parts.length != 2) return null;
        try {
            return new TokenInfo(Long.parseLong(parts[0]), Long.parseLong(parts[1]));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 토큰 삭제 (입장 후 즉시 제거)
     */
    public void deleteToken(String token) {
        redisTemplate.delete(QUEUE_TOKEN_KEY + token);
    }

    /**
     * Pub/Sub publish — 대기열 변경 이벤트 발행
     * Redis가 모든 인스턴스의 QueueUpdateListener에게 전달
     */
    private void publishUpdate(Long concertId) {
        redisTemplate.convertAndSend(QUEUE_UPDATE_CHANNEL + concertId, "update");
    }
}
