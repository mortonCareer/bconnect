package to.bconnect.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.chat.*;
import to.bconnect.api.storage.domain.chat.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ChatFinder {

    private final ChatRepository chatRepository;
    private final ParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    public List<Chat> findAll(Long memberId) {
        List<Long> chatIds = participantRepository.findByMemberId(memberId)
                .stream().map(ParticipantEntity::getChatId).toList();

        if (chatIds.isEmpty()) return List.of();

        List<ChatEntity> chats = chatRepository.findAllById(chatIds);

        Map<Long, List<Long>> participantIds = participantRepository.findByChatIdIn(chatIds)
                .stream()
                .collect(Collectors.groupingBy(
                        ParticipantEntity::getChatId,
                        Collectors.mapping(ParticipantEntity::getMemberId, Collectors.toList())
                ));

        Map<Long, Message> lastMessages = messageRepository.findLatestMessagesByChatIdIn(chatIds)
                .stream()
                .collect(Collectors.toMap(MessageEntity::getChatId, Message::of));

        Map<Long, Long> unreadCounts = messageRepository
                .findUnreadCountByChatIdsAndMemberId(chatIds, memberId)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        return chats.stream()
                .map(chat -> Chat.of(
                        chat,
                        participantIds.get(chat.getId()),
                        lastMessages.get(chat.getId()),
                        unreadCounts.get(chat.getId())
                )).toList();
    }
}
