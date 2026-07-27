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
import java.util.Objects;

/**
 * Attachment 참조 연결 · 제거 (권한검증 미포함)
 */
@Component
@RequiredArgsConstructor
public class AttachmentLinker {

    private final AttachmentRepository attachmentRepository;

    @Transactional
    public void link(ReferenceType referenceType, Long referenceId, Collection<Long> attachmentIds) {
        val ids = attachmentIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty())
            return;

        val attachments = attachmentRepository.findAllById(ids);
        if (attachments.size() != ids.size())
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        attachments.forEach(it -> {
            if (it.getStatus() != AttachmentStatus.COMPLETED)
                throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
            if (it.getReferenceType() != null
                    && (it.getReferenceType() != referenceType || !referenceId.equals(it.getReferenceId())))
                throw new CodeException(AttachmentExceptionCode.INVALID_LINKED);
            it.link(referenceType, referenceId);
        });
    }

    @Transactional
    public void link(ReferenceType referenceType, Long referenceId, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (attachment.getStatus() != AttachmentStatus.COMPLETED)
            throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
        if (attachment.getReferenceType() != null
                && (attachment.getReferenceType() != referenceType || !referenceId.equals(attachment.getReferenceId())))
            throw new CodeException(AttachmentExceptionCode.INVALID_LINKED);
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
        val attachments = attachmentRepository.findAllByReferenceTypeAndReferenceId(referenceType, referenceId);
        attachments.forEach(AttachmentEntity::unlink);
    }

    @Transactional
    public void unlink(ReferenceType referenceType, Long referenceId, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (attachment.getReferenceType() != referenceType || !referenceId.equals(attachment.getReferenceId()))
            throw new CodeException(AttachmentExceptionCode.INVALID_LINKED);
        attachment.unlink();
    }
}
