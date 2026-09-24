package com.sporekart.shared.infrastructure;

import com.sporekart.identity.application.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LoggingNotificationService implements NotificationService {

    @Override
    public void sendOtpSms(String phone, String code) {
        log.info("Dispatched OTP SMS to phone: {} [server-side notification]", phone);
    }

    @Override
    public void sendOtpEmail(String email, String code) {
        log.info("Dispatched OTP Email to email: {} [server-side notification]", email);
    }
}
