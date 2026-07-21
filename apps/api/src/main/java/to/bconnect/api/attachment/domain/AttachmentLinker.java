package to.bconnect.api.attachment.domain;

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

@Component
@RequiredArgsConstructor
public class AttachmentLinker {

    private final AttachmentRepository attachmentRepository;

    @Transactional
    public void link(Long memberId, ReferenceType referenceType, Long referenceId, Collection<Long> attachmentIds) {
        if(attachmentIds.isEmpty())
            return;

        val attachments = attachmentRepository.findAllById(attachmentIds);
        if (attachments.size() != attachmentIds.size())
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        attachments.forEach(it -> {
            if (!it.getMemberId().equals(memberId))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            if (it.getStatus() != AttachmentStatus.COMPLETED)
                throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
            it.link(referenceType, referenceId);
        });
    }

    @Transactional
    public void link(Long memberId, ReferenceType referenceType, Long referenceId, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!attachment.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (attachment.getStatus() != AttachmentStatus.COMPLETED)
            throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
        attachment.link(referenceType, referenceId);
    }

    @Transactional
    public void unlink(ReferenceType referenceType, Collection<Long> referenceIds) {
        if (referenceIds.isEmpty())
            return;

        attachmentRepository.findAllByReferenceTypeAndReferenceIdIn(referenceType, referenceIds)
                .forEach(AttachmentEntity::unlink);
    }

    @Transactional
    public void unlink(ReferenceType referenceType, Long referenceId) {
        attachmentRepository.findAllByReferenceTypeAndReferenceId(referenceType, referenceId)
                .forEach(AttachmentEntity::unlink);
    }

    public void validate(Long memberId, ReferenceType referenceType, Long referenceId, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!attachment.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (attachment.getReferenceType() != referenceType || !referenceId.equals(attachment.getReferenceId()))
            throw new CodeException(AttachmentExceptionCode.INVALID_LINKED);
    }
}
