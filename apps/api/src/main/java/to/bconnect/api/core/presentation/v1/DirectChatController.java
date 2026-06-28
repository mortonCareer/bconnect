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
import to.bconnect.api.core.presentation.v1.request.CreateDirectChatRequest;
import to.bconnect.api.core.presentation.v1.response.AttachmentResponse;
import to.bconnect.api.core.presentation.v1.response.DirectChatResponse;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.chat.DirectChat;
import to.bconnect.api.core.domain.chat.DirectChatService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/direct-chats")
@RequiredArgsConstructor
public class DirectChatController {

    private final DirectChatService directChatService;
    private final MemberResolver memberResolver;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<DirectChatResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val directChats = directChatService.list(user.id());

        val memberIds = directChats.stream()
                .map(DirectChat::memberId)
                .distinct()
                .toList();
        val memberMap = memberResolver.resolveMap(memberIds);

        val response = directChats.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return DirectChatResponse.of(it, member != null ? MemberSummaryResponse.of(member) : null);
                })
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateDirectChatRequest request) {
        val id = directChatService.findOrCreate(user.id(), request.memberId());
        return ApiResponse.success(id);
    }

    @GetMapping("/{chatId}/messages")
    public ApiResponse<CursorPage<MessageResponse>> listMessages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long chatId,
            CursorLimit cursorLimit) {
        val page = directChatService.listMessages(user, chatId, cursorLimit);

        val attachmentIds = page.content().stream()
                .flatMap(it -> it.attachmentIds().stream())
                .distinct()
                .toList();

        val attachmentMap = attachmentResolver.resolveMap(attachmentIds);

        val content = page.content().stream()
                .map(it -> MessageResponse.of(it, it.attachmentIds().stream()
                        .map(attachmentMap::get)
                        .filter(Objects::nonNull)
                        .map(att -> AttachmentResponse.of(att, attachmentResolver.url(att, ImageSize.SMALL)))
                        .toList()))
                .toList();

        val response = new CursorPage<MessageResponse>(
                content,
                page.hasNext(),
                page.nextCursor()
        );
        return ApiResponse.success(response);
    }
}
