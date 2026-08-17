package to.bconnect.api.storage.retention;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface AbuseRecordRepository extends JpaRepository<AbuseRecordEntity, Long> {

    int deleteByExpireAtBefore(Instant threshold);
}
