package to.bconnect.api.attachment.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Attachment 조회 · 권한 검증 (별도 메서드)
 */
@Component
@RequiredArgsConstructor
public class AttachmentFinder {

    private final AttachmentRepository attachmentRepository;

    @Transactional(readOnly = true)
    public Attachment get(ReferenceType referenceType, Long referenceId, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId).
                orElseThrow(() -> new CodeException(AttachmentExceptionCode.NOT_FOUND));
        if (attachment.getReferenceType() != referenceType || !referenceId.equals(attachment.getReferenceId()))
            throw new CodeException(AttachmentExceptionCode.INVALID_LINKED);

        return Attachment.of(attachment);
    }

    /**
     * 권한 검증 없는 단순 Attachment 조회
     */
    @Transactional(readOnly = true)
    public List<Attachment> list(Collection<Long> attachmentIds) {
        if (attachmentIds.isEmpty())
            return List.of();

        val attachments = attachmentRepository.findAllById(attachmentIds);
        if (attachments.size() != attachmentIds.size())
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        return attachments.stream()
                .map(Attachment::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Attachment> list(ReferenceType referenceType, Long referenceId) {
        if (referenceId == null)
            return List.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceId(referenceType, referenceId).stream()
                .map(Attachment::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Attachment> list(ReferenceType referenceType, Long referenceId, AttachmentType type) {
        if (referenceId == null)
            return List.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdAndType(referenceType, referenceId, type).stream()
                .map(Attachment::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<Long, Attachment> map(ReferenceType referenceType, Collection<Long> referenceIds, AttachmentType type) {
        if (referenceIds == null)
            return Map.of();

        val ids = referenceIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty())
            return Map.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdInAndType(referenceType, ids, type).stream()
                .map(Attachment::of)
                .collect(Collectors.toMap(Attachment::referenceId, Function.identity(), (a, b) -> a));
    }

    @Transactional(readOnly = true)
    public Map<Long, List<Attachment>> listMap(ReferenceType referenceType, Collection<Long> referenceIds) {
        if (referenceIds == null)
            return Map.of();

        val ids = referenceIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty())
            return Map.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdIn(referenceType, ids).stream()
                .map(Attachment::of)
                .collect(Collectors.groupingBy(Attachment::referenceId));
    }

    @Transactional(readOnly = true)
    public Map<Long, List<Attachment>> listMap(ReferenceType referenceType, Collection<Long> referenceIds, AttachmentType type) {
        if (referenceIds == null)
            return Map.of();

        val ids = referenceIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty())
            return Map.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdInAndType(referenceType, ids, type).stream()
                .map(Attachment::of)
                .collect(Collectors.groupingBy(Attachment::referenceId));
    }

    @Transactional(readOnly = true)
    public void validateOwnership(Long memberId, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!attachment.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }


    @Transactional(readOnly = true)
    public void validateOwnership(Long memberId, List<Long> attachmentIds) {
        if (attachmentIds.isEmpty())
            return;

        val attachments = attachmentRepository.findAllById(attachmentIds);
        if (attachments.size() != attachmentIds.size())
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        attachments.forEach(it -> {
            if (!it.getMemberId().equals(memberId))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        });
    }
}
