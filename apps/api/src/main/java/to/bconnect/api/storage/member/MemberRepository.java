package to.bconnect.api.storage.member;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<MemberEntity, Long> {

    Window<MemberEntity> findAllBy(ScrollPosition position, Limit limit, Sort sort);

    Optional<MemberEntity> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<MemberEntity> findByPhone(String phone);

    List<MemberEntity> findAllByIdIn(Collection<Long> ids);

    List<MemberEntity> findAllByUsernameIn(Collection<String> usernames);
}
