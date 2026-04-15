package com.ticketing.user.service;

import com.ticketing.user.dto.LoginRequest;
import com.ticketing.user.dto.LoginResponse;
import com.ticketing.user.dto.RegisterRequest;
import com.ticketing.user.entity.User;
import com.ticketing.user.repository.UserRepository;
import com.ticketing.user.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RestTemplate restTemplate;

    @Value("${toss.secret-key}")
    private String tossSecretKey;

    @Value("${toss.confirm-url}")
    private String tossConfirmUrl;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        boolean premium = user.isPremiumActive();
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), premium);
        return new LoginResponse(token,
                new LoginResponse.UserInfo(user.getId(), user.getName(), user.getEmail(), premium));
    }

    @Transactional(readOnly = true)
    public LoginResponse.UserInfo getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return new LoginResponse.UserInfo(user.getId(), user.getName(), user.getEmail(), user.isPremiumActive());
    }

    /**
     * Toss 결제 검증 후 프리미엄 업그레이드
     * 1. Toss API로 결제 최종 승인 요청
     * 2. 성공하면 isPremium = true 저장 + 새 JWT 발급
     */
    @Transactional
    public LoginResponse confirmPremiumPayment(Long userId, String paymentKey, String orderId, int amount) {
        verifyTossPayment(paymentKey, orderId, amount);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.upgradeToPremium();

        String newToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), true);
        return new LoginResponse(newToken,
                new LoginResponse.UserInfo(user.getId(), user.getName(), user.getEmail(), true));
    }

    /**
     * Toss API 결제 최종 승인
     * POST https://api.tosspayments.com/v1/payments/confirm
     * Authorization: Basic Base64(secretKey:)
     */
    private void verifyTossPayment(String paymentKey, String orderId, int amount) {
        String encoded = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + encoded);

        Map<String, Object> body = Map.of(
                "paymentKey", paymentKey,
                "orderId", orderId,
                "amount", amount
        );

        try {
            restTemplate.exchange(
                    tossConfirmUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
        } catch (Exception e) {
            throw new IllegalStateException("결제 검증 실패: " + e.getMessage());
        }
    }

    /** mock 업그레이드 (테스트용 — Toss 키 없을 때) */
    @Transactional
    public LoginResponse upgradeToPremium(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.upgradeToPremium();
        String newToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), true);
        return new LoginResponse(newToken,
                new LoginResponse.UserInfo(user.getId(), user.getName(), user.getEmail(), true));
    }
}
