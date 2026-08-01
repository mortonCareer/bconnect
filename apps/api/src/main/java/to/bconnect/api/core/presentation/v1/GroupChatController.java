package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.*;
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
import to.bconnect.api.storage.attachment.AttachmentReferenceType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/group-chats")
@RequiredArgsConstructor
public class GroupChatController {

    private final GroupChatService groupChatService;
    private final MemberResolver memberResolver;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentUrlService attachmentUrlService;
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
        val memberMap = memberResolver.resolveMapOrWithdrawn(memberIds);
        val urlMap = attachmentUrlService.map(
                AttachmentReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val body = chats.stream()
                .map(it -> GroupChatResponse.of(
                        it,
                        it.participantIds().stream()
                                .map(memberMap::get)
                                .toList(),
                        urlMap
                ))
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }

    @GetMapping("/{id}")
    public ApiResponse<GroupChatResponse> get(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val chat = groupChatService.get(user.id(), id);
        val memberMap = memberResolver.resolveMapOrWithdrawn(chat.participantIds());
        val urlMap = attachmentUrlService.map(
                AttachmentReferenceType.MEMBER, chat.participantIds(), ImageSize.SMALL);
        val members = chat.participantIds().stream()
                .map(memberMap::get)
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(GroupChatResponse.of(chat, members, urlMap));
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
        val attachmentMap = attachmentFinder.listMap(AttachmentReferenceType.MESSAGE, messageIds);

        val content = page.content().stream()
                .map(it -> {
                    val attachments = attachmentMap.getOrDefault(it.id(), List.of());
                    val urlMap = attachmentUrlService.parseUrlMap(attachments, ImageSize.SMALL);
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
