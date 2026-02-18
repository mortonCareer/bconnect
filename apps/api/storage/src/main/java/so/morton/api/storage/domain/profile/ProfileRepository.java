package so.morton.api.storage.domain.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.value.EntityStatus;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<ProfileEntity, Long> {

    Optional<ProfileEntity> findByMemberId(Long memberId);

    Optional<ProfileEntity> findByMemberIdAndStatus(Long memberId, EntityStatus status);
}
