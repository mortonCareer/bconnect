package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateChatRequest;
import to.bconnect.api.core.presentation.v1.response.ChatResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.core.domain.chat.ChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.security.AuthUser;
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
    public ApiResponse<List<ChatResponse>> list(@AuthenticationPrincipal AuthUser user) {
        List<ChatResponse> response = chatService.list(user.id()).stream()
                .map(ChatResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateChatRequest request) {
        Long id = chatService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @GetMapping("/{chatId}/messages")
    public ApiResponse<CursorPage<MessageResponse>> listMessages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long chatId,
            CursorLimit cursorLimit) {
        CursorPage<Message> page = chatService.listMessages(user, chatId, cursorLimit);
        CursorPage<MessageResponse> response = new CursorPage<>(
                MessageResponse.of(page.content()),
                page.hasNext(),
                page.nextCursor()
        );
        return ApiResponse.success(response);
    }
}
