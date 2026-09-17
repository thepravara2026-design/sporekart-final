package com.sporekart.cart.api.dto;

import java.util.ArrayList;
import java.util.List;

public class CartValidationResponse {

    private boolean valid;
    private List<String> warnings = new ArrayList<>();
    private List<String> errors = new ArrayList<>();

    public CartValidationResponse() {}

    public CartValidationResponse(boolean valid, List<String> warnings, List<String> errors) {
        this.valid = valid;
        this.warnings = warnings;
        this.errors = errors;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
