package com.sporekart.identity.application;

public record GoogleTokenClaims(
        String subject,
        String email,
        boolean emailVerified,
        String name,
        String givenName,
        String familyName,
        String picture
) {
}

