package to.bconnect.api.socket.message;

import jakarta.validation.constraints.NotNull;
import lombok.val;
import org.springframework.util.StringUtils;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.chat.ChatExceptionCode;
import to.bconnect.api.storage.chat.MessageType;

import java.util.List;

public record SendMessageRequest(
        @NotNull MessageType type,
        String content,
        List<Long> attachmentIds
) {
    public SendMessage toCommand() {
        List<Long> ids = attachmentIds == null ? List.of() : attachmentIds.stream().distinct().toList();
        val hasContent = StringUtils.hasText(content);
        val hasAttachments = !ids.isEmpty();

        switch (type) {
            case TEXT -> {
                if (hasAttachments)
                    throw new CodeException(ChatExceptionCode.INVALID_ATTACHMENT);
                if (!hasContent)
                    throw new CodeException(CommonExceptionCode.NOT_VALID);
            }
            case IMAGE, FILE -> {
                if (!hasAttachments)
                    throw new CodeException(ChatExceptionCode.INVALID_ATTACHMENT);
            }
            default -> throw new CodeException(CommonExceptionCode.NOT_VALID);
        }

        return new SendMessage(type, content, content, ids);
    }
}
