package to.bconnect.api.storage.profile;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<ProfileEntity, Long> {

    Window<ProfileEntity> findAllBy(ScrollPosition position, Limit limit, Sort sort);

    Optional<ProfileEntity> findByMemberId(Long memberId);

    List<ProfileEntity> findAllByMemberIdIn(Collection<Long> memberIds);

    boolean existsByMemberId(Long memberId);
}
