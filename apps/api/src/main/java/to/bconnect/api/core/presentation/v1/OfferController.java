package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.chat.DirectChatService;
import to.bconnect.api.core.domain.chat.MessageService;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.core.domain.offer.OfferService;
import to.bconnect.api.core.presentation.v1.request.CreateOfferRequest;
import to.bconnect.api.core.presentation.v1.request.ReorderOfferRequest;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;
    private final DirectChatService directChatService;
    private final MessageService messageService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateOfferRequest request) {
        val offer = offerService.create(user, request.toCommand());
        val chatId = directChatService.findOrCreate(user.id(), offer.workerId());
        messageService.send(chatId, ChatType.DIRECT, user.id(),
                new SendMessage(MessageType.OFFER, String.valueOf(offer.id()), List.of()));
        return ApiResponse.success(offer.id());
    }

    @PutMapping("/reorder")
    public ApiResponse<Void> reorder(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid ReorderOfferRequest request) {
        offerService.reorder(user, request.toCommand());
        // TODO 이벤트 발송
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val offer = offerService.accept(user, id);
        val chatId = directChatService.findOrCreate(user.id(), offerService.getCompanyOwnerId(offer.taskId()));
        messageService.send(chatId, ChatType.DIRECT, user.id(),
                new SendMessage(MessageType.OFFER, String.valueOf(offer.id()), List.of()));
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val promoted = offerService.deny(user, id);
        if (promoted.isPresent()) {
            val offer = promoted.get();
            val companyOwnerId = offerService.getCompanyOwnerId(offer.taskId());
            val chatId = directChatService.findOrCreate(companyOwnerId, offer.workerId());
            messageService.send(chatId, ChatType.DIRECT, companyOwnerId,
                    new SendMessage(MessageType.OFFER, String.valueOf(offer.id()), List.of()));
        }
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val promoted = offerService.cancel(user, id);
        if (promoted.isPresent()) {
            val offer = promoted.get();
            val chatId = directChatService.findOrCreate(user.id(), offer.workerId());
            messageService.send(chatId, ChatType.DIRECT, user.id(),
                    new SendMessage(MessageType.OFFER, String.valueOf(offer.id()), List.of()));
        }
        return ApiResponse.success(null);
    }
}
