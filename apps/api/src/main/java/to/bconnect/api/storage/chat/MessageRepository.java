package to.bconnect.api.storage.chat;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    Window<MessageEntity> findAllByChatIdAndChatType(Long chatId, ChatType chatType, ScrollPosition position, Limit limit, Sort sort);

    @Query("SELECT m FROM MessageEntity m WHERE m.id IN " +
           "(SELECT MAX(m2.id) FROM MessageEntity m2 WHERE m2.chatId IN :chatIds AND m2.chatType = :chatType GROUP BY m2.chatId)")
    List<MessageEntity> findLatestMessagesByChatIdInAndChatType(Collection<Long> chatIds, ChatType chatType);

    @Query("SELECT p.chatId, COUNT(m) FROM ParticipantEntity p " +
           "LEFT JOIN MessageEntity m ON m.chatId = p.chatId AND m.chatType = 'GROUP' AND m.id > p.lastIdx " +
           "WHERE p.memberId = :memberId AND p.chatId IN :chatIds " +
           "GROUP BY p.chatId")
    List<Object[]> findGroupUnreadCountByChatIdsAndMemberId(Collection<Long> chatIds, Long memberId);

    @Query("SELECT d.id, COUNT(m) FROM DirectChatEntity d " +
           "LEFT JOIN MessageEntity m ON m.chatId = d.id AND m.chatType = 'DIRECT' " +
           "AND m.id > (CASE WHEN d.minId = :memberId THEN d.minLastIdx ELSE d.maxLastIdx END) " +
           "WHERE d.id IN :chatIds " +
           "GROUP BY d.id")
    List<Object[]> findDirectUnreadCountByChatIdsAndMemberId(Collection<Long> chatIds, Long memberId);
}
