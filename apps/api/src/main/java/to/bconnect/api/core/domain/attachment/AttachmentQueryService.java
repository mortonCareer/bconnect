package to.bconnect.api.core.domain.attachment;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentQueryService {

    private final AttachmentRepository attachmentRepository;

    @Transactional(readOnly = true)
    public List<Attachment> list(AuthUser user, List<Long> attachmentIds) {
        List<AttachmentEntity> attachments = attachmentRepository.findAllById(attachmentIds);
        if (attachments.size() != attachmentIds.size())
            throw new CodeException(AttachmentExceptionCode.NOT_FOUND);

        attachments.forEach(it -> {
            if (!it.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            if (it.getStatus() != AttachmentStatus.COMPLETED)
                throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
        });

        return Attachment.of(attachments);
    }

    @Transactional(readOnly = true)
    public Attachment get(AuthUser user, Long attachmentId) {
        AttachmentEntity attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(AttachmentExceptionCode.NOT_FOUND));
        if (!attachment.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (attachment.getStatus() != AttachmentStatus.COMPLETED)
            throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);

        return Attachment.of(attachment);
    }
}
