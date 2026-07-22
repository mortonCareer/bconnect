package to.bconnect.api.attachment.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.infrastructure.cloudfront.CloudFrontUrlResolver;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AttachmentResolver {

    private final AttachmentRepository attachmentRepository;
    private final CloudFrontUrlResolver urlResolver;

    @Transactional(readOnly = true)
    public String getUrl(ReferenceType referenceType, Long referenceId, ImageSize size) {
        if (referenceId == null)
            return null;

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdIn(referenceType, List.of(referenceId)).stream()
                .findFirst()
                .map(it -> parseUrl(Attachment.of(it), size))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Attachment> list(ReferenceType referenceType, Long referenceId) {
        if (referenceId == null)
            return List.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdIn(referenceType, List.of(referenceId)).stream()
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
    public Map<Long, Attachment> resolveMap(ReferenceType referenceType, Collection<Long> referenceIds) {
        if (referenceIds == null)
            return Map.of();

        val ids = referenceIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty())
            return Map.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdIn(referenceType, ids).stream()
                .map(Attachment::of)
                .collect(Collectors.toMap(Attachment::referenceId, Function.identity(), (a, b) -> a));
    }

    @Transactional(readOnly = true)
    public Map<Long, String> resolveUrlMap(ReferenceType referenceType, Collection<Long> referenceIds, ImageSize size) {
        return resolveMap(referenceType, referenceIds).values().stream()
                .collect(Collectors.toMap(Attachment::referenceId, it -> parseUrl(it, size)));
    }

    @Transactional(readOnly = true)
    public Map<Long, List<Attachment>> resolveListMap(ReferenceType referenceType, Collection<Long> referenceIds) {
        if (referenceIds == null)
            return Map.of();

        val ids = referenceIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty())
            return Map.of();

        return attachmentRepository.findAllByReferenceTypeAndReferenceIdIn(referenceType, ids).stream()
                .map(Attachment::of)
                .collect(Collectors.groupingBy(Attachment::referenceId));
    }

    public String parseUrl(Attachment attachment, ImageSize size) {
        if (attachment == null)
            return null;

        val ext = attachment.type() == AttachmentType.IMAGE && size != ImageSize.ORIGINAL
                ? size.getExtension()
                : attachment.ext();
        val key = AttachmentKeyUtils.key(
                attachment.context(), attachment.contextId(), attachment.type(),
                size, attachment.uuid(), ext);
        return urlResolver.resolve(key);
    }
}
