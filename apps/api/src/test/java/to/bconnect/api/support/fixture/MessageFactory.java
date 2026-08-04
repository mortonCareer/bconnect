package to.bconnect.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.MessageTemplate;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.socket.message.SocketMessageSentEvent;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.storage.chat.MessageType;

import java.util.Set;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

@Component
public class MessageFactory {

    @Autowired private MessageRepository messageRepository;

    public MessageEntity entity(Long chatId, Long memberId) {
        return messageRepository.save(new MessageEntity(chatId, ChatType.GROUP, memberId, MessageType.TEXT, "content"));
    }

    public static Message domain(Long id, Long chatId, Long memberId, MessageType type) {
        return new Message(id, chatId, ChatType.GROUP, memberId, type, "content",
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static Message template(Long id, Long chatId, Long memberId) {
        return new Message(id, chatId, ChatType.GROUP, memberId, MessageType.SYSTEM, MessageTemplate.CHAT_CREATED,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static SendMessage command() {
        return new SendMessage(MessageType.TEXT, "content", null);
    }

    public static SendMessage command(MessageType type, String content) {
        return new SendMessage(type, content, null);
    }

    public static SocketMessageSentEvent sentEvent(Long chatId, Long senderId, Set<Long> activeIds, Set<Long> inactiveIds) {
        return new SocketMessageSentEvent(activeIds, inactiveIds,
                domain(1L, chatId, senderId, MessageType.TEXT));
    }
}
