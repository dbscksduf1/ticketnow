package com.ticketing.concert.repository;

import com.ticketing.concert.entity.Concert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ConcertRepository extends JpaRepository<Concert, Long> {

    List<Concert> findByCategory(Concert.Category category);

    // 후행 와일드카드만 사용 → 인덱스 활용 가능 (앞 % 제거)
    @Query("SELECT c FROM Concert c WHERE c.title LIKE :keyword% OR c.organizer LIKE :keyword%")
    List<Concert> searchByKeyword(String keyword);

    List<Concert> findByCategoryAndTitleContaining(Concert.Category category, String keyword);
}
