package to.bconnect.api.core.domain.drive;

import to.bconnect.api.storage.drive.DriveType;

public record CreateDrive(
        DriveType type,
        Long projectId,
        String title
) {}
