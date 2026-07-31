package to.bconnect.api.storage.device;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceTokenEntity, Long> {

    Optional<DeviceTokenEntity> findByToken(String token);

    Optional<DeviceTokenEntity> findByMemberIdAndToken(Long memberId, String token);

    List<DeviceTokenEntity> findByMemberIdAndEnabledTrue(Long memberId);
}
