package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentUrlService;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.core.domain.chat.GroupChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.chat.ChatType;

import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class MessageSocketService {

    private final MessageManager messageManager;
    private final MessageSocketManager messageSocketManager;
    private final GroupChatService groupChatService;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentUrlService attachmentUrlService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Message broadcast(Long chatId, ChatType chatType, Long senderId, SendMessage command) {
        val message = messageManager.create(chatId, chatType, senderId, command);

        val activeIds = messageSocketManager.resolveActiveIds(chatId, chatType);
        val participantIds = groupChatService.findParticipantIds(chatId, chatType);
        val inactiveIds = new HashSet<>(participantIds);
        inactiveIds.removeAll(activeIds);

        val attachments = attachmentFinder.list(AttachmentReferenceType.MESSAGE, message.id());
        val urlMap = attachmentUrlService.parseUrlMap(attachments, ImageSize.SMALL);

        messageSocketManager.send(chatId, chatType, message, attachments, urlMap);
        messageManager.markRead(chatId, chatType, activeIds, message.id());
        eventPublisher.publishEvent(new SocketMessageSentEvent(
                activeIds, inactiveIds, message));
        return message;
    }
}
