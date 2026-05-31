package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.api.controller.v1.request.CreateChatRequest;
import to.bconnect.api.api.controller.v1.response.ChatResponse;
import to.bconnect.api.api.controller.v1.response.MessageResponse;
import to.bconnect.api.domain.chat.ChatDetail;
import to.bconnect.api.domain.chat.ChatService;
import to.bconnect.api.domain.chat.Message;
import to.bconnect.api.support.security.User;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ApiResponse<List<ChatResponse>> getMyChats(@AuthenticationPrincipal User user) {
        List<ChatResponse> response = chatService.getMyChats(user.id()).stream()
                .map(ChatResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<ChatResponse> createChat(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateChatRequest request) {
        ChatDetail chat = chatService.create(user, request);
        return ApiResponse.success(ChatResponse.of(chat));
    }

    @GetMapping("/{chatId}/messages")
    public ApiResponse<CursorPage<MessageResponse>> getChatMessages(
            @AuthenticationPrincipal User user,
            @PathVariable Long chatId,
            CursorLimit cursorLimit) {
        CursorPage<Message> page = chatService.getMessages(user, chatId, cursorLimit);
        CursorPage<MessageResponse> response = new CursorPage<>(
                MessageResponse.of(page.content()),
                page.nextCursor(),
                page.hasNext()
        );
        return ApiResponse.success(response);
    }
}
