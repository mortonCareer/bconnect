package to.bconnect.api.storage.domain.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<MemberEntity, Long> {

    Optional<MemberEntity> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<MemberEntity> findByPhone(String phone);

    List<MemberEntity> findByIdIn(Collection<Long> ids);

    @Query("SELECT m.id FROM MemberEntity m WHERE m.username IN :usernames")
    List<Long> findIdsByUsernameIn(@Param("usernames") Collection<String> usernames);
}
