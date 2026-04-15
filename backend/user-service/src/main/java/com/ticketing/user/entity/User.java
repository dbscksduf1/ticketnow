package com.ticketing.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Column(nullable = false)
    private boolean isPremium = false;

    private LocalDateTime premiumExpiresAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = Role.USER;
        this.isPremium = false;
    }

    /** 프리미엄 업그레이드 (30일) */
    public void upgradeToPremium() {
        this.isPremium = true;
        this.premiumExpiresAt = LocalDateTime.now().plusDays(30);
    }

    /** 실제 프리미엄 활성 여부 (만료 체크 포함) */
    public boolean isPremiumActive() {
        if (!isPremium) return false;
        return premiumExpiresAt == null || premiumExpiresAt.isAfter(LocalDateTime.now());
    }

    public enum Role {
        USER, ADMIN
    }
}
