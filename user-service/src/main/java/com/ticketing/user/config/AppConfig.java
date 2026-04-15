package com.ticketing.user.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(3))  // Toss API 연결 대기 최대 3초
            .setReadTimeout(Duration.ofSeconds(10))     // 결제 확인 응답 최대 10초
            .build();
    }
}
