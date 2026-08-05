package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.drive.CreateDrive;
import to.bconnect.api.core.domain.drive.Drive;
import to.bconnect.api.core.domain.drive.DriveUsage;
import to.bconnect.api.storage.drive.DriveEntity;
import to.bconnect.api.storage.drive.DriveMemberEntity;
import to.bconnect.api.storage.drive.DriveType;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class DriveFactory {

    private static final Long USED_BYTES = 1024L;
    private static final Long LIMIT_BYTES = 1024L * 1024 * 1024;

    public static Drive domain(Long id, Long projectId, Long memberId) {
        return new Drive(id, DriveType.PROJECT, projectId, memberId, "title",
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static DriveUsage usage() {
        return new DriveUsage(USED_BYTES, LIMIT_BYTES);
    }

    public static CreateDrive command(Long projectId) {
        return new CreateDrive(DriveType.PROJECT, projectId, "title");
    }

    public static DriveEntity entity(Long projectId, Long memberId) {
        return new DriveEntity(
                DriveType.PROJECT,
                projectId,
                memberId,
                "title"
        );
    }

    public static DriveMemberEntity memberEntity(Long driveId, Long memberId) {
        return new DriveMemberEntity(
                driveId,
                memberId,
                "title"
        );
    }
}
