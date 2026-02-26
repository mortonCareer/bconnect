package so.morton.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.chat.ParticipantEntity;
import so.morton.api.storage.domain.chat.ChatRepository;
import so.morton.api.storage.domain.chat.MessageRepository;
import so.morton.api.storage.domain.chat.ParticipantRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatFinder {

    private final ChatRepository chatRepository;
    private final ParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    public Chat find(Long chatId, Long memberId) {
        return chatRepository.findById(chatId)
                .filter(e -> !e.isDeleted())
                .map(entity -> {
                    List<Long> participantIds = participantRepository.findByChatId(chatId)
                            .stream()
                            .map(ParticipantEntity::getMemberId)
                            .toList();

                    Message lastMessage = messageRepository.findTopByChatIdOrderByIdDesc(chatId)
                            .map(Message::of)
                            .orElse(null);

                    int unreadCount = participantRepository.findByChatIdAndMemberId(chatId, memberId)
                            .map(p -> (int) messageRepository.countByChatIdAndIdGreaterThan(chatId, p.getLastIdx()))
                            .orElse(0);

                    return Chat.of(entity, participantIds, lastMessage, unreadCount);
                })
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Chat> findByMember(Long memberId) {
        return participantRepository.findByMemberId(memberId)
                .stream()
                .map(participant -> find(participant.getChatId(), memberId))
                .toList();
    }
}
