package com.ticketing.reservation.config;

import com.ticketing.reservation.sse.QueueUpdateListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * Redis Pub/Sub 설정
 *
 * - 채널 패턴: queue:update:concert:* (모든 공연 업데이트 구독)
 * - 멀티 인스턴스 환경: Redis가 모든 인스턴스의 리스너에게 메시지 전달
 *   → 어느 인스턴스에 SSE가 연결되어 있어도 업데이트 수신 보장
 */
@Configuration
public class RedisConfig {

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            QueueUpdateListener queueUpdateListener) {

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // queue:update:concert:1, queue:update:concert:2 ... 전체 구독
        container.addMessageListener(queueUpdateListener,
                new PatternTopic("queue:update:concert:*"));
        return container;
    }
}
