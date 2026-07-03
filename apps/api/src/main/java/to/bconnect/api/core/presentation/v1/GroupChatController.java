package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.chat.GroupChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.presentation.v1.request.CreateGroupChatRequest;
import to.bconnect.api.core.presentation.v1.response.GroupChatResponse;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/group-chats")
@RequiredArgsConstructor
public class GroupChatController {

    private final GroupChatService groupChatService;
    private final MemberResolver memberResolver;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<GroupChatResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val chats = groupChatService.list(user.id());
        val memberIds = chats.stream()
                .flatMap(it -> it.participantIds().stream())
                .distinct()
                .toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val urlMap = attachmentResolver.resolveUrlMap(
                ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val response = chats.stream()
                .map(it -> GroupChatResponse.of(
                        it,
                        it.participantIds().stream()
                                .map(memberMap::get)
                                .filter(Objects::nonNull)
                                .map(m -> MemberSummaryResponse.of(m, urlMap.get(m.id())))
                                .toList()
                ))
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateGroupChatRequest request) {
        val id = groupChatService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<CursorPage<MessageResponse>> listMessages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            CursorLimit cursorLimit) {
        val page = groupChatService.listMessages(user, id, cursorLimit);
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
