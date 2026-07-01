package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.AttachmentContextValidator;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.chat.ParticipantRepository;

@Component
@RequiredArgsConstructor
public class ChatAttachmentValidator implements AttachmentContextValidator {

    private final ParticipantRepository participantRepository;

    @Override
    public AttachmentContext context() {
        return AttachmentContext.CHAT;
    }

    @Override
    public void validate(Long memberId, Long contextId) {
        if (!participantRepository.existsByChatIdAndMemberId(contextId, memberId))
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);
    }
}
