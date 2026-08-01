package to.bconnect.api.support.fixture;

import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.domain.ObjectHead;
import to.bconnect.api.attachment.domain.PresignFile;
import to.bconnect.api.attachment.domain.PresignedFile;
import to.bconnect.api.attachment.domain.cleanup.CleanupResult;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;

import java.util.UUID;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class AttachmentFactory {

    private static final String DEFAULT_UUID = "00000000-0000-0000-0000-000000000000";
    private static final String CONTENT_TYPE = "image/png";
    private static final Long SIZE = 1024L;

    public static Attachment domain(Long id, Long memberId, Long contextId, Long referenceId) {
        return new Attachment(id, memberId, AttachmentType.IMAGE, AttachmentStatus.COMPLETED,
                AttachmentContext.POST, contextId, AttachmentReferenceType.POST, referenceId,
                DEFAULT_UUID, "stem", "png", CONTENT_TYPE, SIZE,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static PresignFile presignFile() {
        return new PresignFile("stem.png", CONTENT_TYPE, SIZE);
    }

    public static PresignedFile presignedFile(Long id) {
        return new PresignedFile(id, "https://upload.bconnect.to/" + DEFAULT_UUID);
    }

    public static ObjectHead objectHead() {
        return new ObjectHead(CONTENT_TYPE, SIZE);
    }

    public static CleanupResult cleanupResult() {
        return new CleanupResult(1, 1);
    }

    public static AttachmentEntity entity(Long memberId, Long contextId) {
        return new AttachmentEntity(
                memberId,
                AttachmentType.IMAGE,
                AttachmentContext.POST,
                contextId,
                UUID.randomUUID().toString(),
                "stem",
                "png",
                CONTENT_TYPE,
                SIZE
        );
    }

    public static AttachmentEntity fileEntity(Long memberId, Long contextId) {
        return new AttachmentEntity(
                memberId,
                AttachmentType.FILE,
                AttachmentContext.POST,
                contextId,
                UUID.randomUUID().toString(),
                "stem",
                "pdf",
                "application/pdf",
                SIZE
        );
    }
}
