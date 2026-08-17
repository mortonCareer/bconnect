package to.bconnect.api.storage.profile;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<ProfileEntity, Long> {

    Window<ProfileEntity> findAllBy(ScrollPosition position, Limit limit, Sort sort);

    Optional<ProfileEntity> findByMemberId(Long memberId);

    List<ProfileEntity> findAllByMemberIdIn(Collection<Long> memberIds);

    boolean existsByMemberId(Long memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM profile_trades WHERE profile_id IN (SELECT id FROM profiles WHERE member_id = :memberId)", nativeQuery = true)
    int purgeTradesByMemberId(@Param("memberId") Long memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM profiles WHERE member_id = :memberId", nativeQuery = true)
    int purgeByMemberId(@Param("memberId") Long memberId);
}
