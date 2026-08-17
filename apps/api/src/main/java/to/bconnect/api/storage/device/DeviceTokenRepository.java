package to.bconnect.api.storage.device;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceTokenEntity, Long> {

    Optional<DeviceTokenEntity> findByToken(String token);

    Optional<DeviceTokenEntity> findByMemberIdAndToken(Long memberId, String token);

    List<DeviceTokenEntity> findByMemberIdAndEnabledTrue(Long memberId);

    List<DeviceTokenEntity> findAllByMemberId(Long memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM device_tokens WHERE member_id = :memberId", nativeQuery = true)
    int purgeByMemberId(@Param("memberId") Long memberId);
}
