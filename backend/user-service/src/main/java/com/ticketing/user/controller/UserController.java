package com.ticketing.user.controller;

import com.ticketing.user.dto.LoginRequest;
import com.ticketing.user.dto.LoginResponse;
import com.ticketing.user.dto.RegisterRequest;
import com.ticketing.user.dto.TossConfirmRequest;
import com.ticketing.user.security.JwtTokenProvider;
import com.ticketing.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse.UserInfo> getMyInfo(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.getMyInfo(userId));
    }

    /** Toss 결제 검증 후 프리미엄 전환 */
    @PostMapping("/premium/confirm")
    public ResponseEntity<LoginResponse> confirmPremium(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody TossConfirmRequest request) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(
                userService.confirmPremiumPayment(userId, request.getPaymentKey(), request.getOrderId(), request.getAmount())
        );
    }

    /** 테스트용 mock 업그레이드 (Toss 키 없을 때) */
    @PostMapping("/premium/upgrade")
    public ResponseEntity<LoginResponse> upgradeToPremium(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.upgradeToPremium(userId));
    }

    private Long extractUserId(String authHeader) {
        return jwtTokenProvider.getUserId(authHeader.replace("Bearer ", ""));
    }
}
