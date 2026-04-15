# Oracle Cloud 배포 가이드

## 1. Oracle Cloud 무료 VM 생성

1. [cloud.oracle.com](https://cloud.oracle.com) 회원가입 (신용카드 필요, 청구 안 됨)
2. **Compute > Instances > Create Instance**
3. 설정:
   - Shape: **VM.Standard.A1.Flex** (ARM, Always Free)
   - OCPU: 4, Memory: 24GB (최대치 선택)
   - OS: Ubuntu 22.04
   - SSH Key: 새로 생성 후 `.pem` 파일 다운로드

## 2. VM 접속 및 초기 설정

```bash
# SSH 접속
ssh -i ~/Downloads/your-key.pem ubuntu@<VM_PUBLIC_IP>

# Docker 설치
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Docker Compose 설치
sudo apt-get install -y docker-compose-plugin

# 확인
docker --version
docker compose version
```

## 3. 방화벽 포트 오픈

Oracle Cloud 콘솔에서:
- **Networking > VCN > Security Lists > Ingress Rules 추가**

| 포트 | 용도 |
|------|------|
| 80 | 프론트엔드 |
| 8080 | API Gateway |
| 443 | HTTPS (선택) |

```bash
# Ubuntu UFW도 설정
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 4. 프로젝트 배포

```bash
# VM에서 실행
git clone https://github.com/your-username/ticketing.git
cd ticketing

# 환경변수 파일 생성
cat > .env << EOF
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-app-password
JWT_SECRET=ticketnow-secret-key-for-jwt-signing-2024
EOF

# 전체 서비스 빌드 & 실행
docker compose up --build -d

# 로그 확인
docker compose logs -f
```

## 5. Gradle Wrapper 추가 (빌드 전 필요)

각 서비스 폴더에서 실행:
```bash
# 로컬에서 (Gradle 설치 필요)
cd user-service && gradle wrapper
cd ../concert-service && gradle wrapper
cd ../reservation-service && gradle wrapper
cd ../notification-service && gradle wrapper
cd ../api-gateway && gradle wrapper
```

또는 Docker 멀티스테이지 빌드가 자동 처리합니다.

## 6. 서비스 상태 확인

```bash
# 전체 컨테이너 상태
docker compose ps

# 각 서비스 헬스체크
curl http://localhost:8080/actuator/health  # gateway
curl http://localhost:8081/actuator/health  # user
curl http://localhost:8082/actuator/health  # concert
curl http://localhost:8083/actuator/health  # reservation

# 공연 목록 확인
curl http://localhost:8080/api/concerts
```

## 7. 부하테스트 실행

```bash
# k6 설치
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# 부하테스트 실행
cd k6
k6 run ticketing-load-test.js
```

## 8. 도메인 연결 (선택)

무료 도메인: [freenom.com](https://freenom.com) 또는 [duckdns.org](https://duckdns.org)

```bash
# HTTPS 설정 (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
