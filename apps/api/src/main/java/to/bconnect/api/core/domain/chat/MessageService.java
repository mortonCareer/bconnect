package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Window;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.common.request.CursorLimit;

@Component
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;

    public Window<Message> findAllByChatId(Long chatId, CursorLimit cursorLimit) {
        Window<MessageEntity> entities = messageRepository.findAllByChatId(
                chatId,
                cursorLimit.toScrollPosition(),
                cursorLimit.toLimit(),
                cursorLimit.toSort());
        return entities.map(Message::of);
    }
}
