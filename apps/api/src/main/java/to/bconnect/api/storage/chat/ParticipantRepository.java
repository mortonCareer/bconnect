package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;

public interface ParticipantRepository extends JpaRepository<ParticipantEntity, Long> {

    List<ParticipantEntity> findByMemberId(Long memberId);

    List<ParticipantEntity> findByChatIdIn(Collection<Long> chatIds);

    @Query("SELECT p.memberId FROM ParticipantEntity p WHERE p.chatId = :chatId")
    List<Long> findMemberIdsByChatId(@Param("chatId") Long chatId);

    boolean existsByChatIdAndMemberId(Long chatId, Long memberId);

    @Modifying
    @Query("UPDATE ParticipantEntity p SET p.lastIdx = :messageId " +
           "WHERE p.chatId = :chatId AND p.memberId IN :memberIds")
    int updateLastIdxIn(@Param("chatId") Long chatId,
                        @Param("memberIds") Collection<Long> memberIds,
                        @Param("messageId") Long messageId);
}
