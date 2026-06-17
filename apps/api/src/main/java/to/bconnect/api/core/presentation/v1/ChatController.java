package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateChatRequest;
import to.bconnect.api.core.presentation.v1.response.ChatResponse;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.core.domain.chat.ChatService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MemberResolver memberResolver;

    @GetMapping
    public ApiResponse<List<ChatResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val chats = chatService.list(user.id());

        val memberIds = chats.stream()
                .flatMap(it -> it.participantIds().stream())
                .distinct()
                .toList();
        val memberMap = memberResolver.resolveMap(memberIds);

        val response = chats.stream()
                .map(it -> ChatResponse.of(
                        it,
                        it.participantIds().stream()
                                .map(memberMap::get)
                                .filter(Objects::nonNull)
                                .map(MemberSummaryResponse::of)
                                .toList()
                ))
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateChatRequest request) {
        val id = chatService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @GetMapping("/{chatId}/messages")
    public ApiResponse<CursorPage<MessageResponse>> listMessages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long chatId,
            CursorLimit cursorLimit) {
        val page = chatService.listMessages(user, chatId, cursorLimit);
        CursorPage<MessageResponse> response = new CursorPage<>(
                MessageResponse.of(page.content()),
                page.hasNext(),
                page.nextCursor()
        );
        return ApiResponse.success(response);
    }
}
