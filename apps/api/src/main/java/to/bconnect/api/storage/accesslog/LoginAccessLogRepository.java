package to.bconnect.api.storage.accesslog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface LoginAccessLogRepository extends JpaRepository<LoginAccessLogEntity, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LoginAccessLogEntity a WHERE a.createdAt <= :threshold")
    int deleteExpired(@Param("threshold") Instant threshold);
}
