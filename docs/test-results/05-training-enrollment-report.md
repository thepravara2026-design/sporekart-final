# 05 — Training Discovery, Trainee Enrollment & Cancellation Report

## 1. Training Academy Overview & Catalog Discovery

### A. Course & Masterclass Catalog
- Sporekart offers structured agricultural masterclasses accessible at `/training`:
  - `Commercial Oyster & Milky Mushroom Cultivation Masterclass` (Fee: ₹1,499)
  - `Lab-Certified Pure Grain Spawn Production & Tissue Culture` (Fee: ₹2,999)
  - Commercial Farm Setup & Dehydration Blueprints
- Each course consists of syllabus modules, instructor credentials, certification outcomes, and specific training batch slots (`training_slots`).

### B. Batch Details & Capacity Rules
- Each batch specifies:
  - `startDate` & `endDate`.
  - `mode`: Online webinar or physical laboratory practicals at Davangere agritech center.
  - `maxCapacity`: Total student capacity.
  - `enrolledCount`: Live count of enrolled trainees.
- When `enrolledCount >= maxCapacity`, subsequent enrollment attempts are rejected with `BatchCapacityExceededException` (HTTP 409 Conflict).

---

## 2. Trainee Enrollment Lifecycle

### A. Enrollment Flow
1. Trainee selects course and chooses an available batch slot.
2. Calls `POST /api/v1/training/enroll` passing `{ batchId: UUID, slotId: UUID }` with customer JWT authentication.
3. Backend validates:
   - Trainee identity is authenticated.
   - Batch slot exists and is open for enrollment.
   - Batch has remaining seat capacity.
   - User does not already possess an active enrollment for the identical batch.
4. An enrollment entity is created in `training_enrollments` in status `CONFIRMED` or `PENDING_PAYMENT`.
5. Batch `enrolledCount` increments atomically.
6. Notifications are created for both the trainee and the admin.

### B. Trainee Dashboard
- Enrolled courses appear in the trainee's dashboard at `/dashboard?tab=trainings`.
- Displays batch schedule, meeting link / location instructions, payment status, and completion certificate download upon batch completion.

---

## 3. Training Cancellation Policy & Refund Mechanics

### A. Strict 7-Day Cutoff Policy (`TRAIN-CUTOFF-01`)
- **Implemented Business Logic** (`TrainingService.java` line 361):
  ```java
  if (LocalDate.now().plusDays(7).isAfter(startDate)) {
      throw new IllegalStateException("Enrollment cancellation is only permitted at least 7 days before the batch start date.");
  }
  ```
- **Policy Enforcement**:
  - If cancellation is attempted within 7 days of the batch start date:
    - Request is rejected with HTTP 409 Conflict.
    - Error response contains code `CONFLICT` and explanatory message.
    - Enrollment remains `CONFIRMED` and no refund is issued.
  - If cancellation is requested >= 7 days prior:
    - Enrollment status transitions to `CANCELLED`.
    - Batch capacity `enrolledCount` decrements by 1 (seat released for new students).
    - Refund is credited to the student's wallet or payment gateway.

### B. Error Handling & Contract Integrity (`API-ERR-CONTRACT-01`)
- When a cancellation is rejected by policy, backend returns `ApiResponse.error("CONFLICT", message)`.
- Client applications must read error details from `error.message` rather than root `message` to handle rejected cancellations gracefully.

---

## 4. Training Module Audit Summary
- **Course Discovery & Syllabus**: **PASS**
- **Batch Selection & Capacity Limits**: **PASS**
- **Enrollment Flow & Payment**: **PASS**
- **Duplicate Enrollment Prevention**: **PASS**
- **Trainee Dashboard Rendering**: **PASS**
- **7-Day Cancellation Cutoff Enforcement**: **PASS**
- **Seat Release on Cancellation**: **PASS**
