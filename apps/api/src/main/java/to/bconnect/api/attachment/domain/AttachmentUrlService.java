package to.bconnect.api.attachment.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.infrastructure.cloudfront.CloudFrontUrlResolver;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AttachmentUrlService {

    private final AttachmentFinder attachmentFinder;
    private final CloudFrontUrlResolver urlResolver;

    @Transactional(readOnly = true)
    public String get(AttachmentReferenceType referenceType, Long referenceId, ImageSize size) {
        return attachmentFinder.list(referenceType, referenceId, AttachmentType.IMAGE).stream()
                .findFirst()
                .map(it -> parseUrl(it, size))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<Long, String> map(AttachmentReferenceType referenceType, Collection<Long> referenceIds, ImageSize size) {
        return attachmentFinder.map(referenceType, referenceIds, AttachmentType.IMAGE).values().stream()
                .collect(Collectors.toMap(Attachment::referenceId, it -> parseUrl(it, size)));
    }

    public String parseUrl(Attachment attachment, ImageSize size) {
        if (attachment == null)
            return null;
        val ext = attachment.type() == AttachmentType.IMAGE && size != ImageSize.ORIGINAL
                ? size.getExtension()
                : attachment.ext();
        val key = AttachmentKeyUtils.key(
                attachment.context(),
                attachment.contextId(),
                attachment.type(),
                size,
                attachment.uuid(),
                ext);
        return urlResolver.resolve(key);
    }

    public Map<Long, String> parseUrlMap(List<Attachment> attachments, ImageSize size) {
        return attachments.stream()
                .collect(Collectors.toMap(Attachment::id, it -> parseUrl(it, size)));
    }
}
