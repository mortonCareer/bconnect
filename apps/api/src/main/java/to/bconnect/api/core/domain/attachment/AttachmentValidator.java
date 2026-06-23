package to.bconnect.api.core.domain.attachment;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentStatus;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AttachmentValidator {

    private final AttachmentRepository attachmentRepository;

    public void validate(AuthUser user, List<Long> attachmentIds) {
        val attachments = attachmentRepository.findAllById(attachmentIds);
        if (attachments.size() != attachmentIds.size())
            throw new CodeException(AttachmentExceptionCode.NOT_FOUND);

        attachments.forEach(it -> {
            if (!it.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            if (it.getStatus() != AttachmentStatus.COMPLETED)
                throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
        });
    }

    public void validate(AuthUser user, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(AttachmentExceptionCode.NOT_FOUND));
        if (!attachment.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (attachment.getStatus() != AttachmentStatus.COMPLETED)
            throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
    }
}
