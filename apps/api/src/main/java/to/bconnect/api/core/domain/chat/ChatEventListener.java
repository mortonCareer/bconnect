package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.core.domain.offer.OfferAcceptedEvent;
import to.bconnect.api.core.domain.offer.OfferActivatedEvent;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageType;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatEventListener {

    private final DirectChatService directChatService;
    private final MessageService messageService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferActivatedEvent(OfferActivatedEvent event) {
        val chatId = directChatService.getOrCreate(event.companyOwnerId(), event.workerId());
        messageService.create(chatId, ChatType.DIRECT, event.companyOwnerId(),
                new SendMessage(MessageType.OFFER, String.valueOf(event.offerId()), List.of()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOfferAcceptedEvent(OfferAcceptedEvent event) {
        val chatId = directChatService.getOrCreate(event.workerId(), event.companyOwnerId());
        messageService.create(chatId, ChatType.DIRECT, event.workerId(),
                new SendMessage(MessageType.OFFER, String.valueOf(event.offerId()), List.of()));
    }
}
