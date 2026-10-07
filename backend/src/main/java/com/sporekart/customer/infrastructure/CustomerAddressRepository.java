package com.sporekart.customer.infrastructure;

import com.sporekart.customer.domain.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {
    List<CustomerAddress> findByUserId(UUID userId);
    Optional<CustomerAddress> findByIdAndUserId(UUID id, UUID userId);
    Optional<CustomerAddress> findByUserIdAndIsDefaultTrue(UUID userId);

    @Query("SELECT COUNT(a) > 0 FROM CustomerAddress a WHERE a.alternatePhone IS NOT NULL AND (a.alternatePhone = :rawPhone OR a.alternatePhone = :withPrefix OR a.alternatePhone LIKE %:last10)")
    boolean isAlternateDeliveryPhoneExist(@Param("rawPhone") String rawPhone, @Param("withPrefix") String withPrefix, @Param("last10") String last10);
}
