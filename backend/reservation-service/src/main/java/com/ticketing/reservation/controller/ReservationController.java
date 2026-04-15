package com.ticketing.reservation.controller;

import com.ticketing.reservation.dto.QueueEnterRequest;
import com.ticketing.reservation.dto.QueueEnterResponse;
import com.ticketing.reservation.dto.ReservationRequest;
import com.ticketing.reservation.dto.ReservationResponse;
import com.ticketing.reservation.security.JwtTokenProvider;
import com.ticketing.reservation.service.QueueService;
import com.ticketing.reservation.service.QueueService.TokenInfo;
import com.ticketing.reservation.service.ReservationService;
import com.ticketing.reservation.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final QueueService queueService;
    private final JwtTokenProvider jwtTokenProvider;
    private final SseEmitterRegistry sseEmitterRegistry;

    // 대기열 진입
    @PostMapping("/queue/enter")
    public ResponseEntity<QueueEnterResponse> enterQueue(
            @RequestBody QueueEnterRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        boolean isPremium = jwtTokenProvider.isPremium(authHeader.replace("Bearer ", ""));
        String token = queueService.enterQueue(request.getConcertId(), userId, isPremium);
        return ResponseEntity.ok(new QueueEnterResponse(token));
    }

    // 대기열 취소
    @PostMapping("/queue/leave")
    public ResponseEntity<Void> leaveQueue(
            @RequestBody QueueEnterRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        queueService.leaveQueue(request.getConcertId(), userId);
        return ResponseEntity.ok().build();
    }

    /**
     * SSE — 대기열 실시간 상태 스트리밍 (Redis Pub/Sub 방식)
     *
     * 기존: ScheduledExecutorService로 2초마다 Redis 폴링
     * 변경: 대기열 변동 시에만 Push → CPU·Redis 부하 대폭 절감
     *
     * 멀티 인스턴스 지원:
     *   - 어느 인스턴스에 SSE가 연결되어도 Redis가 모든 인스턴스에 broadcast
     *   - SseEmitterRegistry가 해당 인스턴스에 연결된 클라이언트에 Push
     */
    @GetMapping(value = "/queue/status", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter queueStatus(@RequestParam String queueToken) {
        SseEmitter emitter = new SseEmitter(300_000L); // 5분 타임아웃

        TokenInfo info = queueService.getTokenInfo(queueToken);
        if (info == null) {
            try { emitter.send(SseEmitter.event().data("{\"status\":\"ERROR\"}")); }
            catch (IOException ignored) {}
            emitter.complete();
            return emitter;
        }

        Long concertId = info.concertId();
        Long userId    = info.userId();

        // 레지스트리에 등록 → Pub/Sub 메시지 수신 시 자동 Push
        sseEmitterRegistry.register(concertId, userId, emitter);

        // 연결 즉시 현재 상태 1회 전송
        try {
            long rank  = queueService.getRank(concertId, userId);
            long total = queueService.getTotal(concertId);
            String status = rank <= 1 ? "READY" : "WAITING";
            String json = String.format(
                "{\"rank\":%d,\"total\":%d,\"status\":\"%s\"}", rank, total, status);
            emitter.send(SseEmitter.event().data(json));

            if ("READY".equals(status)) {
                queueService.deleteToken(queueToken);
                sseEmitterRegistry.remove(concertId, userId);
                emitter.complete();
                return emitter;
            }
        } catch (IOException e) {
            sseEmitterRegistry.remove(concertId, userId);
            emitter.completeWithError(e);
            return emitter;
        }

        // 연결 종료 시 레지스트리에서 제거 (메모리 누수 방지)
        emitter.onCompletion(() -> sseEmitterRegistry.remove(concertId, userId));
        emitter.onTimeout(()    -> sseEmitterRegistry.remove(concertId, userId));
        emitter.onError(e       -> sseEmitterRegistry.remove(concertId, userId));

        return emitter;
    }

    // 예매 확정
    @PostMapping
    public ResponseEntity<ReservationResponse> reserve(
            @RequestBody ReservationRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(reservationService.reserve(userId, request));
    }

    // 내 예매 목록
    @GetMapping("/my")
    public ResponseEntity<List<ReservationResponse>> getMyReservations(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(reservationService.getMyReservations(userId));
    }

    // 예매 취소
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        reservationService.cancel(userId, id);
        return ResponseEntity.ok().build();
    }

    private Long extractUserId(String authHeader) {
        return jwtTokenProvider.getUserId(authHeader.replace("Bearer ", ""));
    }
}
