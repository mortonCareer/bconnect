package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<ParticipantEntity, Long> {

    List<ParticipantEntity> findAllByMemberId(Long memberId);

    List<ParticipantEntity> findAllByChatIdIn(Collection<Long> chatIds);

    @Query("SELECT p.memberId FROM ParticipantEntity p WHERE p.chatId = :chatId")
    List<Long> findMemberIdsByChatId(@Param("chatId") Long chatId);

    List<ParticipantEntity> findAllByChatIdAndMemberIdIn(Long chatId, Collection<Long> memberIds);

    Optional<ParticipantEntity> findByChatIdAndMemberId(Long chatId, Long memberId);

    boolean existsByChatIdAndMemberId(Long chatId, Long memberId);

    long countByChatId(Long chatId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM participants WHERE member_id = :memberId", nativeQuery = true)
    int purgeByMemberId(@Param("memberId") Long memberId);
}
