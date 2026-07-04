package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.chat.GroupChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.presentation.v1.request.CreateGroupChatRequest;
import to.bconnect.api.core.presentation.v1.response.GroupChatResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.support.cloudfront.SignedCookieIssuer;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/group-chats")
@RequiredArgsConstructor
public class GroupChatController {

    private final GroupChatService groupChatService;
    private final MemberResolver memberResolver;
    private final AttachmentResolver attachmentResolver;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<GroupChatResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val chats = groupChatService.list(user.id());
        val memberIds = chats.stream()
                .flatMap(it -> it.participantIds().stream())
                .distinct()
                .toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val urlMap = attachmentResolver.resolveUrlMap(
                ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val body = chats.stream()
                .map(it -> GroupChatResponse.of(
                        it,
                        it.participantIds().stream()
                                .map(memberMap::get)
                                .filter(Objects::nonNull)
                                .toList(),
                        urlMap
                ))
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
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
            CursorLimit cursorLimit,
            HttpServletResponse response) {
        val page = groupChatService.listMessages(user, id, cursorLimit);
        val messageIds = page.content().stream().map(Message::id).toList();
        val attachmentMap = attachmentResolver.resolveListMap(ReferenceType.MESSAGE, messageIds);

        val content = page.content().stream()
                .map(it -> {
                    val attachments = attachmentMap.getOrDefault(it.id(), List.of());
                    val urlMap = attachments.stream()
                            .collect(Collectors.toMap(Attachment::id, att -> attachmentResolver.parseUrl(att, ImageSize.SMALL)));
                    return MessageResponse.of(it, attachments, urlMap);
                })
                .toList();

        val body = new CursorPage<>(
                content,
                page.hasNext(),
                page.nextCursor()
        );

        val scope = AttachmentKeyUtils.scope(AttachmentContext.CHAT, id);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }
}
