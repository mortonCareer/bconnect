package so.morton.api.storage.domain.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByChatId(Long chatId);

    @Query("SELECT m FROM MessageEntity m WHERE m.id IN " +
           "(SELECT MAX(m2.id) FROM MessageEntity m2 WHERE m2.chatId IN :chatIds GROUP BY m2.chatId)")
    List<MessageEntity> findLatestMessagesByChatIdIn(Collection<Long> chatIds);

    @Query("SELECT m.chatId AS chatId, COUNT(m) AS unreadCount FROM MessageEntity m, ParticipantEntity p " +
           "WHERE m.chatId = p.chatId AND p.memberId = :memberId " +
           "AND m.chatId IN :chatIds AND m.id > p.lastIdx " +
           "GROUP BY m.chatId")
    List<ChatUnreadCount> findUnreadCountByChatIdsAndMemberId(Collection<Long> chatIds, Long memberId);

    interface ChatUnreadCount {
        Long chatId();
        Integer unreadCount();
    }
}
