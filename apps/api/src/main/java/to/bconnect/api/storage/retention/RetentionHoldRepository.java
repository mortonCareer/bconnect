package to.bconnect.api.storage.retention;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface RetentionHoldRepository extends JpaRepository<RetentionHoldEntity, Long> {

    List<RetentionHoldEntity> findAllByMemberIdOrderByIdDesc(Long memberId);

    List<RetentionHoldEntity> findAllByMemberIdAndExpireAtAfter(Long memberId, Instant threshold);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RetentionHoldEntity r WHERE r.expireAt <= :threshold")
    int deleteExpired(@Param("threshold") Instant threshold);
}
