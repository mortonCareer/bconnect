package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageRepository;

@Component
@RequiredArgsConstructor
public class MessageFinder {

    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public CursorPage<Message> list(Long chatId, ChatType type, CursorLimit cursor) {
        val messages = messageRepository.findAllByChatIdAndChatType(
                chatId,
                type,
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(
                messages.map(Message::of),
                Message::id
        );
    }

    @Transactional(readOnly = true)
    public Long unreadCount(Long memberId) {
        val direct = messageRepository.findDirectUnreadCountByMemberId(memberId);
        val group = messageRepository.findGroupUnreadCountByMemberId(memberId);
        return direct + group;
    }
}
