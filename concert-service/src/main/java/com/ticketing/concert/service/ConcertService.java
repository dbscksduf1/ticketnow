package com.ticketing.concert.service;

import com.ticketing.concert.dto.ConcertResponse;
import com.ticketing.concert.dto.SeatReserveResponse;
import com.ticketing.concert.dto.SeatResponse;
import com.ticketing.concert.entity.Concert;
import com.ticketing.concert.entity.Seat;
import com.ticketing.concert.repository.ConcertRepository;
import com.ticketing.concert.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConcertService {

    private final ConcertRepository concertRepository;
    private final SeatRepository seatRepository;

    // 공연 목록 조회 — Redis 캐싱 (5분)
    @Cacheable(value = "concerts", key = "#category + '_' + #keyword")
    @Transactional(readOnly = true)
    public List<ConcertResponse> getConcerts(String category, String keyword) {
        List<Concert> concerts;

        boolean hasCategory = StringUtils.hasText(category);
        boolean hasKeyword = StringUtils.hasText(keyword);

        if (hasCategory && hasKeyword) {
            concerts = concertRepository.findByCategoryAndTitleContaining(
                    Concert.Category.valueOf(category), keyword);
        } else if (hasCategory) {
            concerts = concertRepository.findByCategory(Concert.Category.valueOf(category));
        } else if (hasKeyword) {
            concerts = concertRepository.searchByKeyword(keyword);
        } else {
            concerts = concertRepository.findAll();
        }

        return concerts.stream().map(ConcertResponse::from).collect(Collectors.toList());
    }

    // 공연 상세 조회 — Redis 캐싱 (5분)
    @Cacheable(value = "concert", key = "#id")
    @Transactional(readOnly = true)
    public ConcertResponse getConcert(Long id) {
        Concert concert = concertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("공연을 찾을 수 없습니다."));
        return ConcertResponse.from(concert);
    }

    // 좌석 목록 조회
    @Cacheable(value = "seats", key = "#concertId")
    @Transactional(readOnly = true)
    public List<SeatResponse> getSeats(Long concertId) {
        return seatRepository.findByConcertId(concertId)
                .stream().map(SeatResponse::from).collect(Collectors.toList());
    }

    // 예매 완료 시 캐시 무효화 + 잔여 좌석 감소 → 좌석+공연 정보 반환
    // allEntries=true 대신 특정 키만 evict → thundering herd 방지
    @Caching(evict = {
        @CacheEvict(value = "concert",   key = "#concertId"),
        @CacheEvict(value = "concerts",  allEntries = true),
        @CacheEvict(value = "seats",     key = "#concertId")
    })
    @Transactional
    public SeatReserveResponse decreaseAvailableSeats(Long concertId, Long seatId) {
        Concert concert = concertRepository.findById(concertId)
                .orElseThrow(() -> new IllegalArgumentException("공연을 찾을 수 없습니다."));
        Seat seat = seatRepository.findByConcertIdAndId(concertId, seatId)
                .orElseThrow(() -> new IllegalArgumentException("좌석을 찾을 수 없습니다."));

        seat.reserve();
        concert.decreaseAvailableSeats();
        return SeatReserveResponse.from(concert, seat);
    }

    // 예매 취소 시 잔여 좌석 복구
    @Caching(evict = {
        @CacheEvict(value = "concert",   key = "#concertId"),
        @CacheEvict(value = "concerts",  allEntries = true),
        @CacheEvict(value = "seats",     key = "#concertId")
    })
    @Transactional
    public void increaseAvailableSeats(Long concertId, Long seatId) {
        Concert concert = concertRepository.findById(concertId)
                .orElseThrow(() -> new IllegalArgumentException("공연을 찾을 수 없습니다."));
        Seat seat = seatRepository.findByConcertIdAndId(concertId, seatId)
                .orElseThrow(() -> new IllegalArgumentException("좌석을 찾을 수 없습니다."));

        seat.release();
        concert.increaseAvailableSeats();
    }
}
