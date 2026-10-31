package com.sporekart.identity.application;

public interface GoogleIdTokenVerifier {
    GoogleTokenClaims verify(String idToken);
}

