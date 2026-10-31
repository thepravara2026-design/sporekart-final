package com.sporekart.shared.infrastructure;

import org.slf4j.MDC;
import java.util.UUID;

public class RequestIdContext {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    public static final String MDC_KEY = "requestId";

    public static String getOrGenerateRequestId(String incomingHeader) {
        if (incomingHeader != null && !incomingHeader.isBlank()) {
            return incomingHeader.trim();
        }
        return UUID.randomUUID().toString();
    }

    public static String getCurrentRequestId() {
        String requestId = MDC.get(MDC_KEY);
        return requestId != null ? requestId : "system-internal";
    }

    public static void setCurrentRequestId(String id) {
        if (id != null) {
            MDC.put(MDC_KEY, id);
        } else {
            MDC.remove(MDC_KEY);
        }
    }

    public static void clear() {
        MDC.remove(MDC_KEY);
    }
}
