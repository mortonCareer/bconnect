package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.core.domain.chat.ChatCreatedEvent;
import to.bconnect.api.core.domain.chat.DirectChatService;
import to.bconnect.api.core.domain.chat.MessageTemplate;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.core.domain.task.TaskEvent;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageType;
import to.bconnect.api.storage.member.MemberEntity;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MessageEventListener {

    private final DirectChatService directChatService;
    private final MessageSocketService messageSocketService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferEvent(OfferEvent event) {
        val command = SendMessage.of(event);
        if (command == null)
            return;

        val senderId = switch (event.status()) {
            case ACTIVE -> event.companyOwnerId();
            default -> MemberEntity.SYSTEM_ID;
        };

        val chatId = directChatService.getOrCreate(event.companyOwnerId(), event.workerId());
        messageSocketService.broadcast(chatId, ChatType.DIRECT, senderId, command);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskEvent(TaskEvent event) {
        val chatId = directChatService.getOrCreate(event.companyOwnerId(), event.workerId());
        val command = new SendMessage(MessageType.SYSTEM, MessageTemplate.TASK_UPDATED, List.of());

        messageSocketService.broadcast(chatId, ChatType.DIRECT, MemberEntity.SYSTEM_ID, command);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleChatCreatedEvent(ChatCreatedEvent event) {
        val command = new SendMessage(MessageType.SYSTEM, MessageTemplate.CHAT_CREATED, List.of());

        messageSocketService.broadcast(event.chatId(), event.chatType(), MemberEntity.SYSTEM_ID, command);
    }
}
