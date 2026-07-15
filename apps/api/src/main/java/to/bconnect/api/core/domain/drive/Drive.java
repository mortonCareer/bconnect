package to.bconnect.api.core.domain.drive;

import to.bconnect.api.storage.drive.DriveEntity;
import to.bconnect.api.storage.drive.DriveType;

import java.time.OffsetDateTime;

public record Drive(
        Long id,
        DriveType type,
        Long projectId,
        Long memberId,
        String title,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
) {
    public static Drive of(DriveEntity entity, String title) {
        return new Drive(
                entity.getId(),
                entity.getType(),
                entity.getProjectId(),
                entity.getMemberId(),
                title,
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
