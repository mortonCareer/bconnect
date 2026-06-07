package to.bconnect.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import to.bconnect.api.ws.message.SendMessageRequest;
import to.bconnect.api.core.storage.chat.MessageEntity;
import to.bconnect.api.core.storage.chat.MessageRepository;
import to.bconnect.api.core.storage.chat.MessageType;

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

    public static SendMessageRequest createRequest() {
        return new SendMessageRequest(MessageType.TEXT, "content");
    }

    public static SendMessageRequest createRequest(MessageType type, String content) {
        return new SendMessageRequest(type, content);
    }
}
