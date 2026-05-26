package so.morton.api.storage.domain.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByChatId(Long chatId, Pageable pageable);

    List<MessageEntity> findByChatIdAndIdLessThan(Long chatId, Long cursor, Pageable pageable);

    @Query("SELECT m FROM MessageEntity m WHERE m.id IN " +
           "(SELECT MAX(m2.id) FROM MessageEntity m2 WHERE m2.chatId IN :chatIds GROUP BY m2.chatId)")
    List<MessageEntity> findLatestMessagesByChatIdIn(Collection<Long> chatIds);

    /**
     * @return {@code {chatId: Long, unreadCount: Long}} tuple list — includes 0-count rows
     */
    @Query("SELECT p.chatId, COUNT(m) FROM ParticipantEntity p " +
           "LEFT JOIN MessageEntity m ON m.chatId = p.chatId AND m.id > p.lastIdx " +
           "WHERE p.memberId = :memberId AND p.chatId IN :chatIds " +
           "GROUP BY p.chatId")
    List<Object[]> findUnreadCountByChatIdsAndMemberId(Collection<Long> chatIds, Long memberId);
}
