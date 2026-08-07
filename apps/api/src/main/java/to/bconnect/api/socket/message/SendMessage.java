package to.bconnect.api.socket.message;

import to.bconnect.api.core.domain.chat.MessageTemplate;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.storage.chat.MessageType;

import java.util.List;

public record SendMessage(
        MessageType type,
        String content,
        List<Long> attachmentIds
) {
    public static SendMessage of(OfferEvent event) {
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
