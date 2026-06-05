package to.bconnect.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.chat.MessageEntity;
import to.bconnect.api.storage.domain.chat.MessageRepository;
import to.bconnect.api.common.request.CursorLimit;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MessageFinder {
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
