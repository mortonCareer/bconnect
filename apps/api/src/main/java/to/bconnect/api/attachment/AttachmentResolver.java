package to.bconnect.api.attachment;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.support.cloudfront.CloudFrontProperties;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AttachmentResolver {

    private final AttachmentRepository attachmentRepository;
    private final CloudFrontProperties properties;

    @Transactional(readOnly = true)
    public Map<Long, Attachment> resolveMap(Collection<Long> attachmentIds) {
        return attachmentRepository.findAllById(attachmentIds).stream()
                .map(Attachment::of)
                .collect(Collectors.toMap(Attachment::id, Function.identity()));
    }

    @Transactional(readOnly = true)
    public Map<Long, String> resolveUrlMap(Collection<Long> attachmentIds, ImageSize size) {
        if (attachmentIds == null)
            return Map.of();

        val ids = attachmentIds.stream().filter(Objects::nonNull).distinct().toList();
        return resolveMap(ids).values().stream()
                .collect(Collectors.toMap(Attachment::id, it -> getUrl(it, size)));
    }

    @Transactional(readOnly = true)
    public String getUrl(Long attachmentId, ImageSize size) {
        if (attachmentId == null)
            return null;

        return attachmentRepository.findById(attachmentId)
                .map(it -> getUrl(Attachment.of(it), size))
                .orElse(null);
    }

    public String getUrl(Attachment attachment, ImageSize size) {
        if (attachment == null)
            return null;

        val key = AttachmentKeyUtils.key(
                attachment.context(), attachment.contextId(), attachment.type(),
                size, attachment.uuid(), attachment.ext());
        return "https://" + properties.domain() + "/" + key;
    }
}
