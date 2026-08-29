package to.bconnect.api.storage.otp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpEntity, Long> {

    Optional<OtpEntity> findByPhone(String phone);

    void deleteByPhone(String phone);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE OtpEntity o SET o.code = null, o.revoked = true WHERE o.expiredAt <= :threshold AND o.code IS NOT NULL")
    int clearExpiredCodes(@Param("threshold") Instant threshold);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM OtpEntity o WHERE o.lastSentAt < :lastSentThreshold AND o.expiredAt <= :expiredThreshold")
    int deleteExpiredBefore(
            @Param("lastSentThreshold") Instant lastSentThreshold,
            @Param("expiredThreshold") Instant expiredThreshold
    );

}
