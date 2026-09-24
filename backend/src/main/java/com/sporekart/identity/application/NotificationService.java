package com.sporekart.identity.application;

public interface NotificationService {
    void sendOtpSms(String phone, String code);
    void sendOtpEmail(String email, String code);
}
