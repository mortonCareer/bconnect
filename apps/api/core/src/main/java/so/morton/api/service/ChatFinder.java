package so.morton.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.domain.Chat;
import so.morton.api.domain.Message;
import so.morton.api.storage.entity.ParticipantEntity;
import so.morton.api.storage.repository.ChatRepository;
import so.morton.api.storage.repository.MessageRepository;
import so.morton.api.storage.repository.ParticipantRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatFinder {

    private final ChatRepository chatRepository;
    private final ParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    public Chat find(Long chatId, Long userId) {
        return chatRepository.findById(chatId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(entity -> {
                    List<Long> participantIds = participantRepository.findByChatId(chatId)
                            .stream()
                            .map(ParticipantEntity::getUserId)
                            .toList();

                    Message lastMessage = messageRepository.findTopByChatIdOrderByIdDesc(chatId)
                            .map(Message::of)
                            .orElse(null);

                    int unreadCount = participantRepository.findByChatIdAndUserId(chatId, userId)
                            .map(p -> (int) messageRepository.countByChatIdAndIdGreaterThan(chatId, p.getLastIdx()))
                            .orElse(0);

                    return Chat.of(entity, participantIds, lastMessage, unreadCount);
                })
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Chat> findByUser(Long userId) {
        return participantRepository.findByUserId(userId)
                .stream()
                .map(participant -> find(participant.getChatId(), userId))
                .toList();
    }
}
