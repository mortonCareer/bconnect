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
import to.bconnect.api.core.presentation.v1.response.AttachmentResponse;
import to.bconnect.api.core.presentation.v1.response.ChatResponse;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.core.presentation.v1.response.MessageResponse;
import to.bconnect.api.core.domain.attachment.Attachment;
import to.bconnect.api.core.domain.attachment.AttachmentQueryService;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.chat.Chat;
import to.bconnect.api.core.domain.chat.ChatService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MemberResolver memberResolver;
    private final AttachmentQueryService attachmentQueryService;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<ChatResponse>> list(@AuthenticationPrincipal AuthUser user) {
        List<Chat> chats = chatService.list(user.id());

        List<Long> memberIds = chats.stream()
                .flatMap(it -> it.participantIds().stream())
                .distinct()
                .toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        List<ChatResponse> response = chats.stream()
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
        Long id = chatService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @GetMapping("/{chatId}/messages")
    public ApiResponse<CursorPage<MessageResponse>> listMessages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long chatId,
            CursorLimit cursorLimit) {
        CursorPage<Message> page = chatService.listMessages(user, chatId, cursorLimit);

        List<Long> attachmentIds = page.content().stream()
                .flatMap(it -> it.attachmentIds().stream())
                .distinct()
                .toList();

        Map<Long, Attachment> attachmentMap = attachmentQueryService.resolveMap(attachmentIds);

        List<MessageResponse> content = page.content().stream()
                .map(it -> MessageResponse.of(it, it.attachmentIds().stream()
                        .map(attachmentMap::get)
                        .filter(Objects::nonNull)
                        .map(att -> AttachmentResponse.of(att, attachmentResolver.url(att, ImageSize.SMALL)))
                        .toList()))
                .toList();

        CursorPage<MessageResponse> response = new CursorPage<>(
                content,
                page.hasNext(),
                page.nextCursor()
        );
        return ApiResponse.success(response);
    }
}
