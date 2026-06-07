package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.storage.chat.MessageEntity;
import to.bconnect.api.core.storage.chat.MessageRepository;
import to.bconnect.api.common.request.CursorLimit;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;

    public List<Message> findAllByChatId(Long chatId, CursorLimit cursorLimit) {

        Pageable pageable = cursorLimit.toPageable();

        List<MessageEntity> messages = (cursorLimit.cursor() == null)
                ? messageRepository.findByChatId(chatId, pageable)
                : messageRepository.findByChatIdAndIdLessThan(chatId, cursorLimit.cursor(), pageable);

        return messages.stream()
                .map(Message::of)
                .toList();
    }
}
