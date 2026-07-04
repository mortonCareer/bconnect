package to.bconnect.api.attachment.domain;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import to.bconnect.api.attachment.AttachmentProperties;
import to.bconnect.api.attachment.domain.cleanup.AttachmentContextValidatorRegistry;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.support.s3.S3FileStorage;
import to.bconnect.api.support.s3.ObjectHead;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class AttachmentService {


    private final AttachmentRepository attachmentRepository;
    private final AttachmentProperties attachmentProperties;
    private final AttachmentContextValidatorRegistry attachmentContextValidatorRegistry;
    private final S3FileStorage fileStorage;
    private final List<MediaType> allowedContentTypes;

    public AttachmentService(AttachmentRepository attachmentRepository,
                             AttachmentProperties attachmentProperties,
                             AttachmentContextValidatorRegistry attachmentContextValidatorRegistry,
                             S3FileStorage fileStorage) {
        this.attachmentRepository = attachmentRepository;
        this.attachmentProperties = attachmentProperties;
        this.attachmentContextValidatorRegistry = attachmentContextValidatorRegistry;
        this.fileStorage = fileStorage;
        this.allowedContentTypes = attachmentProperties.allowedContentTypes().stream()
                .map(MediaType::parseMediaType)
                .toList();
    }

    @Transactional
    public List<PresignedFile> presign(Long memberId, AttachmentContext context, AttachmentType type, Long contextId, List<PresignFile> files) {
        attachmentContextValidatorRegistry.validate(memberId, context, contextId);
        if (files.size() > attachmentProperties.maxBatchSize())
            throw new CodeException(AttachmentExceptionCode.TOO_MANY_FILES);

        return files.stream()
                .map(it -> presignOne(memberId, context, type, contextId, it))
                .toList();
    }

    @Transactional
    public List<Attachment> confirm(Long memberId, List<Long> attachmentIds) {
        return attachmentIds.stream()
                .map(it -> confirmOne(memberId, it))
                .toList();
    }

    private PresignedFile presignOne(Long memberId, AttachmentContext context, AttachmentType type, Long contextId, PresignFile file) {
        if (file.size() > attachmentProperties.maxFileSize().toBytes())
            throw new CodeException(AttachmentExceptionCode.FILE_TOO_LARGE);
        if (!isAllowedContentType(file.contentType()))
            throw new CodeException(AttachmentExceptionCode.UNSUPPORTED_FILE_TYPE);

        val uuid = UUID.randomUUID().toString();
        val stem = StringUtils.stripFilenameExtension(file.filename());
        val ext = StringUtils.getFilenameExtension(file.filename());
        val key = AttachmentKeyUtils.key(context, contextId, type, ImageSize.ORIGINAL, uuid, ext);

        val created = attachmentRepository.save(new AttachmentEntity(
                memberId,
                type,
                context,
                contextId,
                uuid,
                stem,
                ext,
                file.contentType(),
                file.size()
        ));

        val uploadUrl = fileStorage.presignPut(key, file.contentType(), attachmentProperties.presignTtl());
        return new PresignedFile(created.getId(), uploadUrl);
    }

    private Attachment confirmOne(Long memberId, Long attachmentId) {
        val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!attachment.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        val key = AttachmentKeyUtils.key(
                attachment.getContext(), attachment.getContextId(), attachment.getType(),
                ImageSize.ORIGINAL, attachment.getUuid(), attachment.getExt());
        val optional = fileStorage.head(key);

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
        val type = MediaType.parseMediaType(contentType);
        if (!type.isConcrete())
            return false;
        return allowedContentTypes.stream().anyMatch(it -> it.includes(type));
    }

    private boolean matches(AttachmentEntity attachment, ObjectHead stored) {
        return attachment.getSize().equals(stored.size())
                && attachment.getContentType().equals(stored.contentType());
    }
}
