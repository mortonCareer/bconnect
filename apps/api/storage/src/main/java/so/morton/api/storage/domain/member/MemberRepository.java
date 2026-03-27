package so.morton.api.storage.domain.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<MemberEntity, Long> {

    Optional<MemberEntity> findByUsername(String username);

    Optional<MemberEntity> findByPhone(String phone);

    List<MemberEntity> findByIdIn(Collection<Long> ids);
}
