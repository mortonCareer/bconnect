package to.bconnect.api.core.domain.attachment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.support.s3.S3FileStorage;
import to.bconnect.api.support.s3.StoredObject;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    private static final Logger log = LoggerFactory.getLogger(AttachmentService.class);

    private final AttachmentRepository attachmentRepository;
    private final AttachmentProperties attachmentProperties;
    private final S3FileStorage fileStorage;
    private final Map<AttachmentContext, AttachmentContextValidator> resolvers;
    private final List<MediaType> allowedContentTypes;

    public AttachmentService(AttachmentRepository attachmentRepository,
                             AttachmentProperties attachmentProperties,
                             S3FileStorage fileStorage,
                             List<AttachmentContextValidator> resolvers) {
        this.attachmentRepository = attachmentRepository;
        this.attachmentProperties = attachmentProperties;
        this.fileStorage = fileStorage;
        this.resolvers = resolvers.stream()
                .collect(Collectors.toUnmodifiableMap(AttachmentContextValidator::context, Function.identity()));
        this.allowedContentTypes = attachmentProperties.allowedContentTypes().stream()
                .map(MediaType::parseMediaType)
                .toList();
    }

    @Transactional
    public List<PresignedFile> presign(AuthUser user, AttachmentContext context, AttachmentType type, Long contextId, List<PresignFile> files) {
        if (files.size() > attachmentProperties.maxBatchSize())
            throw new CodeException(AttachmentExceptionCode.TOO_MANY_FILES);

        AttachmentContextValidator resolver = resolvers.get(context);
        resolver.validate(user, contextId);

        return files.stream()
                .map(it -> presignOne(user, context, type, contextId, it))
                .toList();
    }

    @Transactional
    public List<Attachment> confirm(AuthUser user, List<Long> attachmentIds) {
        return attachmentIds.stream()
                .map(it -> confirmOne(user, it))
                .toList();
    }

    private PresignedFile presignOne(AuthUser user, AttachmentContext context, AttachmentType type, Long contextId, PresignFile file) {
        if (file.size() > attachmentProperties.maxFileSize().toBytes())
            throw new CodeException(AttachmentExceptionCode.FILE_TOO_LARGE);
        if (!isAllowedContentType(file.contentType()))
            throw new CodeException(AttachmentExceptionCode.UNSUPPORTED_FILE_TYPE);

        String uuid = UUID.randomUUID().toString();
        String stem = StringUtils.stripFilenameExtension(file.filename());
        String ext = StringUtils.getFilenameExtension(file.filename());
        String key = AttachmentKeyUtils.key(context, contextId, type, ImageSize.ORIGINAL, uuid, ext);

        AttachmentEntity created = attachmentRepository.save(new AttachmentEntity(
                user.id(),
                type,
                context,
                contextId,
                uuid,
                stem,
                ext,
                file.contentType(),
                file.size()
        ));

        String uploadUrl = fileStorage.presignPut(key, file.contentType(), attachmentProperties.presignTtl());
        return new PresignedFile(created.getId(), uploadUrl);
    }

    private Attachment confirmOne(AuthUser user, Long attachmentId) {
        AttachmentEntity attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(AttachmentExceptionCode.NOT_FOUND));
        if (!attachment.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        String key = AttachmentKeyUtils.key(
                attachment.getContext(), attachment.getContextId(), attachment.getType(),
                ImageSize.ORIGINAL, attachment.getUuid(), attachment.getExt());
        Optional<StoredObject> optional = fileStorage.head(key);

        if (optional.isEmpty() || !matches(attachment, optional.get())) {
            log.warn("attachment confirm 실패: id={}, cause={}",
                    attachment.getId(), optional.isEmpty() ? "객체 없음" : "메타 불일치");
            if (optional.isPresent())
                fileStorage.delete(key);
            attachmentRepository.delete(attachment);
            throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);
        }

        attachment.complete();
        return Attachment.of(attachment);
    }

    private boolean isAllowedContentType(String contentType) {
        MediaType type = MediaType.parseMediaType(contentType);
        if (!type.isConcrete())
            return false;
        return allowedContentTypes.stream().anyMatch(it -> it.includes(type));
    }

    private boolean matches(AttachmentEntity attachment, StoredObject stored) {
        return attachment.getSize().equals(stored.size())
                && attachment.getContentType().equals(stored.contentType());
    }
}
