package com.sporekart.customer.infrastructure;

import com.sporekart.customer.domain.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {
    List<CustomerAddress> findByUserId(UUID userId);
    Optional<CustomerAddress> findByIdAndUserId(UUID id, UUID userId);
    Optional<CustomerAddress> findByUserIdAndIsDefaultTrue(UUID userId);
}
