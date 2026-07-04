package to.bconnect.api.core.domain.drive;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.drive.DriveEntity;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.drive.DriveType;
import to.bconnect.api.storage.project.ProjectRepository;

@Component
@RequiredArgsConstructor
public class DriveValidator {

    private final DriveRepository driveRepository;
    private final DriveMemberRepository driveMemberRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    public void validate(Long driveId, Long memberId) {
        val drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (drive.getType() == DriveType.MEMBER && isMemberDriveOwner(memberId, drive))
            return;
        if (drive.getType() == DriveType.PROJECT && isProjectDriveOwner(memberId, drive.getProjectId()))
            return;
        if (driveMemberRepository.findByDriveIdAndMemberId(driveId, memberId).isPresent())
            return;

        throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }

    public boolean isMemberDriveOwner(Long memberId, DriveEntity drive) {
        return memberId.equals(drive.getMemberId());
    }

    public boolean isProjectDriveOwner(Long memberId, Long projectId) {
        val company = companyRepository.findByMemberId(memberId);
        if (company.isEmpty())
            return false;
        val project = projectRepository.findById(projectId);
        return project.isPresent() && project.get().getCompanyId().equals(company.get().getId());
    }
}
