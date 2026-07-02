package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.presentation.v1.request.CreateDirectChatRequest;
import to.bconnect.api.core.presentation.v1.response.AttachmentResponse;
import to.bconnect.api.core.presentation.v1.response.DirectChatResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.core.domain.chat.DirectChat;
import to.bconnect.api.core.domain.chat.DirectChatService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;

import java.util.List;

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
        val memberIds = directChats.stream().map(DirectChat::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val urlMap = attachmentResolver.resolveUrlMap(ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val response = directChats.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return DirectChatResponse.of(it, member, urlMap.get(member == null ? null : member.id()));
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

    @GetMapping("/{id}/messages")
    public ApiResponse<CursorPage<MessageResponse>> listMessages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            CursorLimit cursorLimit) {
        val page = directChatService.listMessages(user, id, cursorLimit);
        val messageIds = page.content().stream().map(Message::id).toList();
        val attachmentMap = attachmentResolver.resolveListMap(ReferenceType.MESSAGE, messageIds);

        val content = page.content().stream()
                .map(it -> {
                    val attachments = attachmentMap.getOrDefault(it.id(), List.of()).stream()
                            .map(att -> AttachmentResponse.of(att, attachmentResolver.parseUrl(att, ImageSize.SMALL)))
                            .toList();
                    return MessageResponse.of(it, attachments);
                })
                .toList();

        val response = new CursorPage<>(
                content,
                page.hasNext(),
                page.nextCursor()
        );
        return ApiResponse.success(response);
    }
}
