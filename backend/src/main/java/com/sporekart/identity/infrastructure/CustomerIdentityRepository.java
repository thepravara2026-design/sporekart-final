package com.sporekart.identity.infrastructure;

import com.sporekart.identity.domain.CustomerIdentity;
import com.sporekart.identity.domain.IdentityProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerIdentityRepository extends JpaRepository<CustomerIdentity, UUID> {
    Optional<CustomerIdentity> findByProviderAndProviderSubject(IdentityProvider provider, String providerSubject);
    List<CustomerIdentity> findByUserId(UUID userId);
    boolean existsByProviderAndProviderSubject(IdentityProvider provider, String providerSubject);
}
