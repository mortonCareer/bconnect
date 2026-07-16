package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.drive.Drive;
import to.bconnect.api.storage.drive.DriveType;

import java.time.Instant;

public record DriveResponse(
        Long id,
        DriveType type,
        Long projectId,
        Long memberId,
        String title,
        Instant createdAt,
        Instant modifiedAt
) {
    public static DriveResponse of(Drive drive) {
        return new DriveResponse(
                drive.id(),
                drive.type(),
                drive.projectId(),
                drive.memberId(),
                drive.title(),
                drive.createdAt(),
                drive.modifiedAt()
        );
    }
}
