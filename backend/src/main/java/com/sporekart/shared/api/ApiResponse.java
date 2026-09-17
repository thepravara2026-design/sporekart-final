package com.sporekart.shared.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sporekart.shared.infrastructure.RequestIdContext;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String requestId;
    private ErrorDetail error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorDetail {
        private String code;
        private String message;
        private String requestId;
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .requestId(RequestIdContext.getCurrentRequestId())
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        String reqId = RequestIdContext.getCurrentRequestId();
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetail.builder()
                        .code(code)
                        .message(message)
                        .requestId(reqId)
                        .build())
                .build();
    }
}
