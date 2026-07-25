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
import to.bconnect.api.storage.offer.OfferStatus;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatEventListener {

    private final DirectChatService directChatService;
    private final MessageService messageService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferEvent(OfferEvent event) {
        if (event.status() != OfferStatus.ACTIVE && event.status() != OfferStatus.ACCEPTED)
            return;

        val activated = event.status() == OfferStatus.ACTIVE;
        val senderId = activated ? event.companyOwnerId() : event.workerId();
        val receiverId = activated ? event.workerId() : event.companyOwnerId();

        val chatId = directChatService.getOrCreate(senderId, receiverId);
        messageService.create(chatId, ChatType.DIRECT, senderId,
                new SendMessage(MessageType.OFFER, String.valueOf(event.offerId()), List.of()));
    }
}
