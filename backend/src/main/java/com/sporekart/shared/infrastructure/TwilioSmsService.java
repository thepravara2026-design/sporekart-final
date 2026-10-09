package com.sporekart.shared.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class TwilioSmsService {

    @Value("${sporekart.twilio.use-real-twilio:false}")
    private boolean useRealTwilio;

    @Value("${sporekart.twilio.account-sid:}")
    private String accountSid;

    @Value("${sporekart.twilio.auth-token:}")
    private String authToken;

    @Value("${sporekart.twilio.from-phone-number:}")
    private String fromPhoneNumber;

    @Value("${sporekart.twilio.messaging-service-sid:}")
    private String messagingServiceSid;

    private final RestTemplate restTemplate = new RestTemplate();

    public String sendSms(String recipientPhone, String messageText) {
        if (recipientPhone == null || recipientPhone.isBlank()) {
            log.warn("Skipping Twilio SMS dispatch: recipient phone is empty");
            return null;
        }

        String formattedPhone = formatE164Phone(recipientPhone);

        if (useRealTwilio && accountSid != null && !accountSid.isBlank() && authToken != null && !authToken.isBlank()) {
            try {
                String twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

                String auth = accountSid + ":" + authToken;
                String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
                headers.set("Authorization", "Basic " + encodedAuth);

                MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
                requestBody.add("To", formattedPhone);
                requestBody.add("Body", messageText);

                if (messagingServiceSid != null && !messagingServiceSid.isBlank()) {
                    requestBody.add("MessagingServiceSid", messagingServiceSid);
                } else if (fromPhoneNumber != null && !fromPhoneNumber.isBlank()) {
                    requestBody.add("From", fromPhoneNumber);
                } else {
                    requestBody.add("From", "+15005550006"); // Twilio Test Magic Number default
                }

                HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);
                ResponseEntity<Map> response = restTemplate.exchange(twilioUrl, HttpMethod.POST, requestEntity, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    String messageSid = (String) response.getBody().get("sid");
                    log.info("Successfully dispatched Twilio SMS [SID: {}] to: {}", messageSid, formattedPhone);
                    return messageSid;
                } else {
                    log.error("Twilio SMS API error response [{}]: {}", response.getStatusCode(), response.getBody());
                    throw new RuntimeException("Twilio API returned status: " + response.getStatusCode());
                }
            } catch (Exception e) {
                log.error("Failed to send real Twilio SMS to {}: {}", formattedPhone, e.getMessage(), e);
                throw new RuntimeException("Failed to send Twilio SMS: " + e.getMessage(), e);
            }
        } else {
            log.info("[TWILIO SMS DISPATCHED - LOG MODE] To: {}, Body: {}", formattedPhone, messageText);
            return "LOG_MODE_MOCK_SID_" + System.currentTimeMillis();
        }
    }

    public static String formatE164Phone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9+]", "").trim();
        if (digits.startsWith("+")) {
            return digits;
        }
        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        if (digits.length() == 10) {
            return "+91" + digits; // Default Indian Country Code prefix if 10-digit number
        }
        return "+" + digits;
    }
}
