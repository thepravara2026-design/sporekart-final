package com.sporekart.training.domain;

public class BatchCapacityExceededException extends IllegalStateException {

    public BatchCapacityExceededException(String message) {
        super(message);
    }

    public BatchCapacityExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}
