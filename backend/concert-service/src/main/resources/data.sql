INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  '아이유 CONCERT : THE GOLDEN HOUR' AS title,
  '올림픽공원 88잔디마당' AS venue,
  '2026-07-05 18:00:00' AS date,
  150 AS duration, '콘서트' AS category,
  '아이유의 감성과 음악이 하나가 되는 특별한 밤. 골든아워의 빛처럼 따뜻한 공연입니다.' AS description,
  '카카오엔터테인먼트' AS organizer, '전체관람가' AS age_limit,
  99000 AS price, 500 AS total_seats, 450 AS available_seats,
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = '아이유 CONCERT : THE GOLDEN HOUR');

INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  'BTS WORLD TOUR: PERMISSION TO DANCE' AS title,
  'KSPO DOME' AS venue,
  '2026-08-15 19:00:00' AS date,
  180 AS duration, '콘서트' AS category,
  'BTS의 전 세계 투어 서울 공연. 역대 최대 규모의 스테이지로 펼쳐집니다.' AS description,
  'HYBE' AS organizer, '전체관람가' AS age_limit,
  165000 AS price, 1000 AS total_seats, 120 AS available_seats,
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = 'BTS WORLD TOUR: PERMISSION TO DANCE');

INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  '레미제라블' AS title,
  '블루스퀘어 신한카드홀' AS venue,
  '2026-06-20 14:00:00' AS date,
  170 AS duration, '뮤지컬' AS category,
  '전 세계 60개국 2억 명이 관람한 최고의 뮤지컬. 빅터 위고의 감동을 무대 위에서.' AS description,
  'CJ ENM' AS organizer, '만 7세 이상' AS age_limit,
  77000 AS price, 800 AS total_seats, 340 AS available_seats,
  'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = '레미제라블');

INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  '오페라의 유령' AS title,
  '샤롯데씨어터' AS venue,
  '2026-09-01 19:30:00' AS date,
  165 AS duration, '뮤지컬' AS category,
  '앤드루 로이드 웨버의 불멸의 걸작. 30년의 세월을 넘어 다시 돌아온 오페라의 유령.' AS description,
  '설앤컴퍼니' AS organizer, '만 7세 이상' AS age_limit,
  88000 AS price, 600 AS total_seats, 280 AS available_seats,
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = '오페라의 유령');

INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  '2026 KBO 한국시리즈 1차전' AS title,
  '잠실야구장' AS venue,
  '2026-10-22 18:30:00' AS date,
  200 AS duration, '스포츠' AS category,
  '2026 KBO 리그 한국시리즈. 1년을 달려온 최고의 팀들의 격돌!' AS description,
  'KBO' AS organizer, '전체관람가' AS age_limit,
  25000 AS price, 25000 AS total_seats, 8420 AS available_seats,
  'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = '2026 KBO 한국시리즈 1차전');

INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  '손흥민 귀국 기념 특별전' AS title,
  '국립현대미술관 서울' AS venue,
  '2026-07-10 10:00:00' AS date,
  120 AS duration, '전시' AS category,
  '손흥민 선수의 축구 인생을 담은 특별 전시. 유니폼, 트로피, 사진 등 500여 점 전시.' AS description,
  '국립현대미술관' AS organizer, '전체관람가' AS age_limit,
  15000 AS price, 300 AS total_seats, 180 AS available_seats,
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = '손흥민 귀국 기념 특별전');

INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  'SEVENTEEN FOLLOW AGAIN TOUR' AS title,
  '고척스카이돔' AS venue,
  '2026-08-01 18:00:00' AS date,
  160 AS duration, '콘서트' AS category,
  '세계를 사로잡은 SEVENTEEN의 국내 투어. 13인의 완벽한 퍼포먼스!' AS description,
  'PLEDIS Entertainment' AS organizer, '전체관람가' AS age_limit,
  132000 AS price, 2000 AS total_seats, 50 AS available_seats,
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = 'SEVENTEEN FOLLOW AGAIN TOUR');

INSERT INTO concerts (title, venue, date, duration, category, description, organizer, age_limit, price, total_seats, available_seats, poster_url)
SELECT * FROM (SELECT
  '모네: 빛을 그리다' AS title,
  '예술의전당 한가람미술관' AS venue,
  '2026-05-30 10:00:00' AS date,
  90 AS duration, '전시' AS category,
  '인상주의 거장 클로드 모네의 대표작 80여 점을 한자리에서 만나는 특별전.' AS description,
  '예술의전당' AS organizer, '전체관람가' AS age_limit,
  20000 AS price, 200 AS total_seats, 165 AS available_seats,
  'https://images.unsplash.com/photo-1480881565116-5e4c1e6d6f21?w=400&h=520&fit=crop' AS poster_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM concerts WHERE title = '모네: 빛을 그리다');

INSERT INTO seats (concert_id, seat_row, number, grade, status, price)
SELECT c.cid, r.row_name, n.num,
  CASE WHEN r.row_name IN ('A','B') THEN 'VIP'
       WHEN r.row_name IN ('C','D') THEN 'R'
       WHEN r.row_name IN ('E','F') THEN 'S'
       ELSE 'A' END,
  CASE WHEN (n.num + LENGTH(r.row_name)) % 7 = 0 THEN 'RESERVED' ELSE 'AVAILABLE' END,
  CASE WHEN r.row_name IN ('A','B') THEN 150000
       WHEN r.row_name IN ('C','D') THEN 110000
       WHEN r.row_name IN ('E','F') THEN 88000
       ELSE 66000 END
FROM
  (SELECT 1 AS cid UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
   UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) c,
  (SELECT 'A' as row_name UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D'
   UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H'
   UNION SELECT 'I' UNION SELECT 'J') r,
  (SELECT 1 as num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
   UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
   UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
   UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20) n
WHERE NOT EXISTS (SELECT 1 FROM seats WHERE concert_id = c.cid);

-- 좌석 수를 실제 seats 테이블 기준으로 동기화
UPDATE concerts c
SET c.total_seats = (SELECT COUNT(*) FROM seats s WHERE s.concert_id = c.id),
    c.available_seats = (SELECT COUNT(*) FROM seats s WHERE s.concert_id = c.id AND s.status = 'AVAILABLE')
WHERE c.id BETWEEN 1 AND 8;
