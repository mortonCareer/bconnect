package to.bconnect.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import to.bconnect.api.socket.message.SendMessageRequest;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.storage.chat.MessageType;

@Component
public class MessageFactory {

    @Autowired private MessageRepository messageRepository;

    public MessageEntity create(Long chatId, Long memberId) {
        return messageRepository.save(new MessageEntity(chatId, memberId, null, "content"));
    }

    public static SendMessageRequest createRequest() {
        return new SendMessageRequest(MessageType.TEXT, "content", null);
    }

    public static SendMessageRequest createRequest(MessageType type, String content) {
        return new SendMessageRequest(type, content, null);
    }
}
