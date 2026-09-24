package com.sporekart.training.api;

import com.sporekart.training.domain.BatchStatus;
import com.sporekart.training.domain.EnrollmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class TrainingDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCategoryRequest {
        @NotBlank(message = "Category name is required")
        private String name;
        @NotBlank(message = "Slug is required")
        private String slug;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCourseRequest {
        private UUID categoryId;
        @NotBlank(message = "Title is required")
        private String title;
        @NotBlank(message = "Slug is required")
        private String slug;
        private String description;
        @NotNull(message = "Duration in days is required")
        private Integer durationDays;
        @NotNull(message = "Fee is required")
        private BigDecimal feeInr;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBatchRequest {
        @NotNull(message = "Course ID is required")
        private UUID courseId;
        @NotBlank(message = "Batch code is required")
        private String batchCode;
        @NotNull(message = "Start date is required")
        private LocalDate startDate;
        @NotNull(message = "End date is required")
        private LocalDate endDate;
        @NotNull(message = "Capacity is required")
        private Integer capacity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddScheduleRequest {
        @NotNull(message = "Batch ID is required")
        private UUID batchId;
        @NotBlank(message = "Topic is required")
        private String topic;
        @NotNull(message = "Scheduled time is required")
        private ZonedDateTime scheduledAt;
        @NotNull(message = "Duration in minutes is required")
        private Integer durationMinutes;
        private String meetingLink;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrollRequest {
        private UUID batchId;
        private UUID slotId;

        public UUID getTargetBatchId() {
            return batchId != null ? batchId : slotId;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmPaymentRequest {
        @NotBlank(message = "Payment reference is required")
        private String paymentReference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarkAttendanceRequest {
        @NotNull(message = "Enrollment ID is required")
        private UUID enrollmentId;
        @NotNull(message = "Schedule ID is required")
        private UUID scheduleId;
        private boolean isPresent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompleteCourseRequest {
        @NotNull(message = "Enrollment ID is required")
        private UUID enrollmentId;
        private String grade;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseResponse {
        private UUID id;
        private String title;
        private String slug;
        private String description;
        private Integer durationDays;
        private BigDecimal feeInr;
        private String category;
        private String mode;
        private String syllabusJson;
        private boolean isActive;
        private List<BatchSlotResponse> slots;

        @com.fasterxml.jackson.annotation.JsonProperty("priceInr")
        public BigDecimal getPriceInr() {
            return feeInr;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("durationHours")
        public Integer getDurationHours() {
            return durationDays != null ? durationDays * 4 : 28;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchSlotResponse {
        private UUID id;
        private String batchCode;
        private LocalDate startDate;
        private LocalDate endDate;
        private ZonedDateTime startTime;
        private Integer capacity;
        private Integer enrolledCount;
        private Integer availableSeats;
        private boolean isAvailable;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchResponse {
        private UUID id;
        private UUID courseId;
        private String courseTitle;
        private String batchCode;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer capacity;
        private Integer enrolledCount;
        private BatchStatus status;
        private List<ScheduleResponse> schedules;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleResponse {
        private UUID id;
        private String topic;
        private ZonedDateTime scheduledAt;
        private Integer durationMinutes;
        private String meetingLink;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrollmentResponse {
        private UUID id;
        private UUID userId;
        private UUID courseId;
        private String courseTitle;
        private UUID batchId;
        private String batchCode;
        private LocalDate startDate;
        private LocalDate endDate;
        private ZonedDateTime startTime;
        private String locationOrLink;
        private EnrollmentStatus status;
        private BigDecimal feePaidInr;
        private BigDecimal amountPaidInr;
        private String paymentReference;
        private ZonedDateTime enrolledAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificateResponse {
        private UUID id;
        private UUID enrollmentId;
        private String certificateCode;
        private LocalDate issueDate;
        private String certificateUrl;
    }
}
