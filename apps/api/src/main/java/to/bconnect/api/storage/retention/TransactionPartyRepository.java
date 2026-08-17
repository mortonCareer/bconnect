package to.bconnect.api.storage.retention;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface TransactionPartyRepository extends JpaRepository<TransactionPartyEntity, Long> {

    int deleteByExpireAtBefore(Instant threshold);
}
