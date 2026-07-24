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
import to.bconnect.api.core.domain.chat.DirectChat;
import to.bconnect.api.core.domain.chat.DirectChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.presentation.v1.request.CreateDirectChatRequest;
import to.bconnect.api.core.presentation.v1.response.DirectChatResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/direct-chats")
@RequiredArgsConstructor
public class DirectChatController {

    private final DirectChatService directChatService;
    private final MemberResolver memberResolver;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<DirectChatResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val directChats = directChatService.list(user.id());
        val memberIds = directChats.stream().map(DirectChat::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMapOrWithdrawn(memberIds);
        val urlMap = attachmentUrlService.map(ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val body = directChats.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return DirectChatResponse.of(it, member, urlMap.get(member.id()));
                })
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }

    @GetMapping("/{id}")
    public ApiResponse<DirectChatResponse> get(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val chat = directChatService.get(user.id(), id);
        val member = memberResolver.getOrWithdrawn(chat.memberId());
        val picture = attachmentUrlService.get(ReferenceType.MEMBER, member.id(), ImageSize.SMALL);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(DirectChatResponse.of(chat, member, picture));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateDirectChatRequest request) {
        val id = directChatService.getOrCreate(user.id(), request.memberId());
        return ApiResponse.success(id);
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<CursorPage<MessageResponse>> listMessages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            CursorLimit cursorLimit,
            HttpServletResponse response) {
        val page = directChatService.listMessages(user, id, cursorLimit);
        val messageIds = page.content().stream().map(Message::id).toList();
        val attachmentMap = attachmentFinder.listMap(ReferenceType.MESSAGE, messageIds);

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
