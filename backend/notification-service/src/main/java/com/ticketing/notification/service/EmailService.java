package com.ticketing.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendReservationConfirm(Map<String, Object> event) throws Exception {
        String subject = "[TicketNow] 예매가 완료되었습니다 - " + event.get("concertTitle");
        String body = buildConfirmHtml(event);
        sendEmail("ticketnow@example.com", subject, body);
    }

    public void sendReservationCancel(Map<String, Object> event) throws Exception {
        String subject = "[TicketNow] 예매가 취소되었습니다 - " + event.get("concertTitle");
        String body = "<h2>예매 취소 안내</h2>"
                + "<p>예매번호 <b>" + event.get("reservationNumber") + "</b>이 취소되었습니다.</p>"
                + "<p>공연명: " + event.get("concertTitle") + "</p>"
                + "<p>환불은 3~5 영업일 이내 처리됩니다.</p>";
        sendEmail("ticketnow@example.com", subject, body);
    }

    private void sendEmail(String from, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
        log.info("이메일 발송 완료: {}", subject);
    }

    private String buildConfirmHtml(Map<String, Object> event) {
        return """
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6C63FF;">🎫 예매 완료!</h1>
              <p>안녕하세요! 예매가 성공적으로 완료되었습니다.</p>
              <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background:#f9f9f9">
                  <td style="padding:10px; border:1px solid #eee; font-weight:bold;">예매번호</td>
                  <td style="padding:10px; border:1px solid #eee;">%s</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #eee; font-weight:bold;">공연명</td>
                  <td style="padding:10px; border:1px solid #eee;">%s</td>
                </tr>
                <tr style="background:#f9f9f9">
                  <td style="padding:10px; border:1px solid #eee; font-weight:bold;">공연일시</td>
                  <td style="padding:10px; border:1px solid #eee;">%s</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #eee; font-weight:bold;">공연장</td>
                  <td style="padding:10px; border:1px solid #eee;">%s</td>
                </tr>
                <tr style="background:#f9f9f9">
                  <td style="padding:10px; border:1px solid #eee; font-weight:bold;">좌석</td>
                  <td style="padding:10px; border:1px solid #eee;">%s열 %s번 (%s석)</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #eee; font-weight:bold;">결제금액</td>
                  <td style="padding:10px; border:1px solid #eee; color:#6C63FF; font-weight:bold;">%s원</td>
                </tr>
              </table>
              <p style="color:#888; font-size:12px;">본 메일은 발신 전용입니다. 문의: support@ticketnow.com</p>
            </div>
            """.formatted(
                event.get("reservationNumber"),
                event.get("concertTitle"),
                event.get("concertDate"),
                event.get("venue"),
                event.get("seatRow"),
                event.get("seatNumber"),
                event.get("seatGrade"),
                event.get("price")
        );
    }
}
