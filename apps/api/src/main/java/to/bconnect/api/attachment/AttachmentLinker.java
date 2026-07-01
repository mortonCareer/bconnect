package to.bconnect.api.attachment;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.Collection;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AttachmentLinker {

    private final AttachmentRepository attachmentRepository;

    @Transactional
    public void link(Long memberId, ReferenceType referenceType, Long referenceId, Collection<Long> attachmentIds) {
        if (attachmentIds.isEmpty())
            return;

        val attachments = attachmentRepository.findAllById(attachmentIds);
        if (attachments.size() != attachmentIds.size())
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        attachments.forEach(it -> {
            validate(it, memberId);
            it.link(referenceType, referenceId);
        });
    }

    @Transactional
    public void relink(Long memberId, ReferenceType referenceType, Long referenceId, Long attachmentId) {
        unlink(referenceType, List.of(referenceId));
        if (attachmentId == null)
            return;

        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        validate(attachment, memberId);
        attachment.link(referenceType, referenceId);
    }

    @Transactional
    public void unlink(ReferenceType referenceType, Collection<Long> referenceIds) {
        if (referenceIds.isEmpty())
            return;

        attachmentRepository.findByReferenceTypeAndReferenceIdIn(referenceType, referenceIds)
                .forEach(AttachmentEntity::unlink);
    }

    private void validate(AttachmentEntity attachment, Long memberId) {
        if (!attachment.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (attachment.getStatus() != AttachmentStatus.COMPLETED)
            throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
    }
}
