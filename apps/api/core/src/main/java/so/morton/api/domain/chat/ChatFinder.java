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
                .map(found -> {
                    List<Long> participantIds = participantRepository.findByChatId(chatId)
                            .stream()
                            .map(ParticipantEntity::getMemberId)
                            .toList();

                    Message lastMessage = messageRepository.findTopByChatIdOrderByIdDesc(chatId)
                            .map(Message::of)
                            .orElse(null);

                    int unreadCount = participantRepository.findByChatIdAndMemberId(chatId, memberId)
                            .map(e -> (int) messageRepository.countByChatIdAndIdGreaterThan(chatId, e.getLastIdx()))
                            .orElse(0);

                    return Chat.of(found, participantIds, lastMessage, unreadCount);
                })
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Chat> findByMemberId(Long memberId) {
        return participantRepository.findByMemberId(memberId)
                .stream()
                .map(e -> find(e.getChatId(), memberId))
                .toList();
    }
}
