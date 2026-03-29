package so.morton.api.storage.domain.profile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<ProfileEntity, Long> {

    Optional<ProfileEntity> findByMemberId(Long memberId);
    List<ProfileEntity> findByIdIn(Collection<Long> ids);
}
