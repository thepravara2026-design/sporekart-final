package com.sporekart.identity.domain;

import lombok.Getter;

@Getter
public class DuplicateIdentityConflictException extends RuntimeException {
    private final String conflictingField;
    private final String conflictingValue;

    public DuplicateIdentityConflictException(String message, String conflictingField, String conflictingValue) {
        super(message);
        this.conflictingField = conflictingField;
        this.conflictingValue = conflictingValue;
    }

    public DuplicateIdentityConflictException(String message) {
        this(message, null, null);
    }
}
