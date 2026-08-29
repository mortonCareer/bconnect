package to.bconnect.api.core.domain.drive;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.attachment.domain.cleanup.AttachmentCleanupService;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.drive.DriveEntity;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.drive.DriveType;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.project.ProjectRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DriveFileService {

    private final DriveRepository driveRepository;
    private final DriveFinder driveFinder;
    private final AttachmentLinker attachmentLinker;
    private final AttachmentCleanupService attachmentCleanupService;
    private final AttachmentFinder attachmentFinder;
    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<Attachment> list(AuthUser user, Long driveId, AttachmentType type) {
        if (!driveFinder.isOwner(user.id(), driveId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        return attachmentFinder.list(AttachmentReferenceType.DRIVE, driveId, type);
    }

    @Transactional
    public void attach(AuthUser user, Long driveId, List<Long> attachmentIds) {
        if (!driveFinder.isOwner(user.id(), driveId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        val found = driveRepository.findById(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        attachmentFinder.validateOwnership(user.id(), attachmentIds);
        val attachments = attachmentFinder.list(attachmentIds);
        val size = attachments.stream()
                .filter(it -> !driveId.equals(it.referenceId()))
                .mapToLong(Attachment::size)
                .sum();

        // validate size
        if (found.getType() == DriveType.PERSONAL) {
            val member = memberRepository.findById(found.getMemberId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

            if (member.getDriveUsedBytes() + size > member.getDriveLimitBytes())
                throw new CodeException(DriveExceptionCode.LIMIT_EXCEEDED);

            attachmentLinker.link(AttachmentReferenceType.DRIVE, driveId, attachmentIds);
            member.increaseDriveUsed(size);
            return;
        }

        val project = projectRepository.findById(found.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val company = companyRepository.findById(project.getCompanyId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (company.getDriveUsedBytes() + size > company.getDriveLimitBytes())
            throw new CodeException(DriveExceptionCode.LIMIT_EXCEEDED);

        attachmentLinker.link(AttachmentReferenceType.DRIVE, driveId, attachmentIds);
        company.increaseDriveUsed(size);
    }

    @Transactional
    public void detach(AuthUser user, Long driveId, Long attachmentId) {
        if (!driveFinder.isOwner(user.id(), driveId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        val found = driveRepository.findById(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val attachment = attachmentFinder.get(AttachmentReferenceType.DRIVE, driveId, attachmentId);
        attachmentLinker.unlink(AttachmentReferenceType.DRIVE, driveId, attachmentId);

        // decrease usage
        if (found.getType() == DriveType.PERSONAL) {
            val member = memberRepository.findById(found.getMemberId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

            member.decreaseDriveUsed(attachment.size());
            return;
        }
        val project = projectRepository.findById(found.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val company = companyRepository.findById(project.getCompanyId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        company.decreaseDriveUsed(attachment.size());
    }

    @Transactional
    public void deleteAll(DriveEntity drive) {
        val attachments = attachmentFinder.list(AttachmentReferenceType.DRIVE, drive.getId());
        val delta = attachments.stream().mapToLong(Attachment::size).sum();
        attachmentCleanupService.purge(AttachmentReferenceType.DRIVE, drive.getId());

        // decrease usage
        if (drive.getType() == DriveType.PERSONAL) {
            val member = memberRepository.findById(drive.getMemberId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            member.decreaseDriveUsed(delta);
            return;
        }

        val project = projectRepository.findById(drive.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val company = companyRepository.findById(project.getCompanyId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        company.decreaseDriveUsed(delta);
    }

    @Transactional(readOnly = true)
    public DriveUsage usage(AuthUser user, Long driveId) {
        if (!driveFinder.isOwner(user.id(), driveId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        val found = driveRepository.findById(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getType() == DriveType.PERSONAL) {
            val member = memberRepository.findById(found.getMemberId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            return new DriveUsage(member.getDriveUsedBytes(), member.getDriveLimitBytes());
        }

        val project = projectRepository.findById(found.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val company = companyRepository.findById(project.getCompanyId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        return new DriveUsage(company.getDriveUsedBytes(), company.getDriveLimitBytes());
    }
}
