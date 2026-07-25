package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageType;
import to.bconnect.api.storage.member.MemberEntity;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatEventListener {

    private final DirectChatService directChatService;
    private final MessageService messageService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferEvent(OfferEvent event) {
        val command = resolveCommand(event);
        if (command == null)
            return;

        val senderId = switch (event.status()) {
            case ACTIVE -> event.companyOwnerId();
            default -> MemberEntity.SYSTEM_ID;
        };

        val chatId = directChatService.getOrCreate(event.companyOwnerId(), event.workerId());
        messageService.create(chatId, ChatType.DIRECT, senderId, command);
    }

    private static SendMessage resolveCommand(OfferEvent event) {
        return switch (event.status()) {
            case ACTIVE -> new SendMessage(
                    MessageType.OFFER, String.valueOf(event.offerId()), List.of());
            case ACCEPTED -> new SendMessage(
                    MessageType.SYSTEM, MessageTemplate.OFFER_ACCEPTED, List.of());
            case EXPIRED -> new SendMessage(
                    MessageType.SYSTEM, MessageTemplate.OFFER_EXPIRED, List.of());
            default -> null;
        };
    }
}
