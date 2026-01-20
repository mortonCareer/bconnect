package so.morton.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.chat.MessageRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MessageFinder {

    private final MessageRepository messageRepository;

    public Message find(Long messageId) {
        return messageRepository.findById(messageId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(Message::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Message> findByChat(Long chatId) {
        return messageRepository.findByChatId(chatId)
                .stream()
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(Message::of)
                .toList();
    }
}
