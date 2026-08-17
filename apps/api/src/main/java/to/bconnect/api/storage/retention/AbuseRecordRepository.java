package to.bconnect.api.storage.retention;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface AbuseRecordRepository extends JpaRepository<AbuseRecordEntity, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM AbuseRecordEntity a WHERE a.expireAt < :threshold")
    int deleteByExpireAtBefore(@Param("threshold") Instant threshold);
}
