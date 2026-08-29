package to.bconnect.api.storage.retention;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface TransactionPartyRepository extends JpaRepository<TransactionPartyEntity, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM TransactionPartyEntity t WHERE t.expireAt <= :threshold")
    int deleteExpired(@Param("threshold") Instant threshold);
}
