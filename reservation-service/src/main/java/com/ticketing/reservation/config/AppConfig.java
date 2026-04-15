package com.ticketing.reservation.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
@EnableJpaAuditing
public class AppConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(3))   // concert-service 연결 대기 최대 3초
            .setReadTimeout(Duration.ofSeconds(5))       // 응답 대기 최대 5초
            .build();
    }
}
