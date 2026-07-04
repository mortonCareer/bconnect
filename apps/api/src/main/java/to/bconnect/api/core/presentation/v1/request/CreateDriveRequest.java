package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.drive.CreateDrive;
import to.bconnect.api.storage.drive.DriveType;

public record CreateDriveRequest(
        @NotNull DriveType type,
        @NotBlank String title,
        Long projectId
) {
    public CreateDrive toCommand() {
        if (type == DriveType.PROJECT && projectId == null)
            throw new CodeException(CommonExceptionCode.NOT_VALID);

        return new CreateDrive(type, projectId, title);
    }
}
