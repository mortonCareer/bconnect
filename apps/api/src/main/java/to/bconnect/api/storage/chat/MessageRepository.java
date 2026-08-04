package to.bconnect.api.storage.chat;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    Window<MessageEntity> findAllByChatIdAndChatType(Long chatId, ChatType chatType, ScrollPosition position, Limit limit, Sort sort);

    Optional<MessageEntity> findFirstByChatIdAndChatTypeOrderByIdDesc(Long chatId, ChatType chatType);

    void deleteAllByChatIdAndChatType(Long chatId, ChatType chatType);

    @Query("SELECT m FROM MessageEntity m WHERE m.id IN " +
           "(SELECT MAX(m2.id) FROM MessageEntity m2 WHERE m2.chatId IN :chatIds AND m2.chatType = :chatType GROUP BY m2.chatId)")
    List<MessageEntity> findLatestMessagesByChatIdInAndChatType(Collection<Long> chatIds, ChatType chatType);

    default Map<Long, Long> findGroupUnreadCountByChatIdsAndMemberId(Collection<Long> chatIds, Long memberId) {
        return findGroupUnreadCountByChatIdsAndMemberIdRows(chatIds, memberId).stream()
                .collect(Collectors.toMap(
                        it -> ((Number) it[0]).longValue(),
                        it -> ((Number) it[1]).longValue()
                ));
    }

    @Query("SELECT p.chatId, COUNT(m) FROM ParticipantEntity p " +
           "LEFT JOIN MessageEntity m ON m.chatId = p.chatId AND m.chatType = 'GROUP' AND m.id > p.lastIdx " +
           "WHERE p.memberId = :memberId AND p.chatId IN :chatIds " +
           "GROUP BY p.chatId")
    List<Object[]> findGroupUnreadCountByChatIdsAndMemberIdRows(Collection<Long> chatIds, Long memberId);

    @Query("SELECT COUNT(m) FROM ParticipantEntity p " +
           "LEFT JOIN MessageEntity m ON m.chatId = p.chatId AND m.chatType = 'GROUP' AND m.id > p.lastIdx " +
           "WHERE p.memberId = :memberId AND p.chatId = :chatId")
    Long findGroupUnreadCountByChatIdAndMemberId(Long chatId, Long memberId);

    default Map<Long, Long> findDirectUnreadCountByChatIdsAndMemberId(Collection<Long> chatIds, Long memberId) {
        return findDirectUnreadCountByChatIdsAndMemberIdRows(chatIds, memberId).stream()
                .collect(Collectors.toMap(
                        it -> ((Number) it[0]).longValue(),
                        it -> ((Number) it[1]).longValue()
                ));
    }

    @Query("SELECT d.id, COUNT(m) FROM DirectChatEntity d " +
           "LEFT JOIN MessageEntity m ON m.chatId = d.id AND m.chatType = 'DIRECT' " +
           "AND m.id > (CASE WHEN d.minId = :memberId THEN d.minLastIdx ELSE d.maxLastIdx END) " +
           "WHERE d.id IN :chatIds " +
           "GROUP BY d.id")
    List<Object[]> findDirectUnreadCountByChatIdsAndMemberIdRows(Collection<Long> chatIds, Long memberId);

    @Query("SELECT COUNT(m) FROM DirectChatEntity d " +
           "LEFT JOIN MessageEntity m ON m.chatId = d.id AND m.chatType = 'DIRECT' " +
           "AND m.id > (CASE WHEN d.minId = :memberId THEN d.minLastIdx ELSE d.maxLastIdx END) " +
           "WHERE d.id = :chatId")
    Long findDirectUnreadCountByChatIdAndMemberId(Long chatId, Long memberId);
}
