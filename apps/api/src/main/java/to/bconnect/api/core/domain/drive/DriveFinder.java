package to.bconnect.api.core.domain.drive;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.drive.DriveType;
import to.bconnect.api.storage.project.ProjectRepository;

@Component
@RequiredArgsConstructor
public class DriveFinder {

    private final DriveRepository driveRepository;
    private final DriveMemberRepository driveMemberRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public boolean isOwner(Long memberId, Long driveId) {
        val drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        // personal owner
        if (drive.getType() == DriveType.PERSONAL)
            return memberId.equals(drive.getMemberId());

        // company owner
        val company = companyRepository.findByMemberId(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.FORBIDDEN));
        val project = projectRepository.findById(drive.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        return project.getCompanyId().equals(company.getId());
    }

    @Transactional(readOnly = true)
    public boolean isMember(Long memberId, Long driveId) {
        return driveMemberRepository.findByDriveIdAndMemberId(driveId, memberId).isPresent();
    }
}
