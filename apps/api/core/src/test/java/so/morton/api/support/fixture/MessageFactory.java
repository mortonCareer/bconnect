package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.chat.MessageEntity;
import so.morton.api.storage.domain.chat.MessageRepository;

@Component
public class MessageFactory {

    @Autowired private MessageRepository messageRepository;

    public MessageEntity create(Long chatId, Long memberId) {
        return messageRepository.save(MessageEntity.builder()
                .chatId(chatId)
                .memberId(memberId)
                .content("content")
                .build());
    }
}
