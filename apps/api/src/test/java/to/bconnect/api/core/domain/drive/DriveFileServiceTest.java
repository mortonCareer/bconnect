package to.bconnect.api.core.domain.drive;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import to.bconnect.api.attachment.domain.Attachment;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.drive.DriveEntity;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.drive.DriveType;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriveFileServiceTest {

    private static final AuthUser USER = new AuthUser(1L, "1", Set.of(Role.CAREER));

    @Mock private DriveRepository driveRepository;
    @Mock private DriveFinder driveFinder;
    @Mock private AttachmentLinker attachmentLinker;
    @Mock private AttachmentFinder attachmentFinder;
    @Mock private MemberRepository memberRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private CompanyRepository companyRepository;

    @InjectMocks private DriveFileService manager;

    @Test
    @DisplayName("개인 드라이브 첨부 시 회원 사용량이 첨부 크기만큼 증가한다")
    void attach_memberDrive_increasesMemberUsage() {
        var member = member();
        givenMemberDrive(member);
        when(attachmentFinder.list(List.of(1L, 2L)))
                .thenReturn(List.of(attachment(100L), attachment(200L)));

        manager.attach(USER, 10L, List.of(1L, 2L));

        assertThat(member.getDriveUsedBytes()).isEqualTo(300L);
    }

    @Test
    @DisplayName("한도를 초과하는 첨부는 LIMIT_EXCEEDED")
    void attach_overLimit_throwsLimitExceeded() {
        var member = member();
        givenMemberDrive(member);
        when(attachmentFinder.list(List.of(1L)))
                .thenReturn(List.of(attachment(member.getDriveLimitBytes() + 1)));

        assertThatThrownBy(() -> manager.attach(USER, 10L, List.of(1L)))
                .isInstanceOf(CodeException.class)
                .extracting("exceptionCode")
                .isEqualTo(DriveExceptionCode.LIMIT_EXCEEDED);
        assertThat(member.getDriveUsedBytes()).isEqualTo(0L);
    }

    @Test
    @DisplayName("이미 이 드라이브에 링크된 첨부는 사용량에 다시 가산하지 않는다")
    void attach_alreadyLinked_excludedFromDelta() {
        var member = member();
        member.increaseDriveUsed(100L);
        givenMemberDrive(member);
        when(attachmentFinder.list(List.of(1L, 2L)))
                .thenReturn(List.of(linkedAttachment(100L), attachment(200L)));

        manager.attach(USER, 10L, List.of(1L, 2L));

        assertThat(member.getDriveUsedBytes()).isEqualTo(300L);
    }

    @Test
    @DisplayName("소유자가 아니면 첨부할 수 없다")
    void attach_notOwner_throwsForbidden() {
        when(driveFinder.isOwner(USER.id(), 10L)).thenReturn(false);

        assertThatThrownBy(() -> manager.attach(USER, 10L, List.of(1L)))
                .isInstanceOf(CodeException.class)
                .extracting("exceptionCode")
                .isEqualTo(CommonExceptionCode.FORBIDDEN);
    }


    @Test
    @DisplayName("프로젝트 드라이브 첨부 시 소유 업체 사용량이 증가한다")
    void attach_projectDrive_increasesCompanyUsage() {
        var company = company();
        givenProjectDrive(company);
        when(attachmentFinder.list(List.of(1L)))
                .thenReturn(List.of(attachment(500L)));

        manager.attach(USER, 10L, List.of(1L));

        assertThat(company.getDriveUsedBytes()).isEqualTo(500L);
    }

    @Test
    @DisplayName("첨부 삭제 시 해당 첨부 크기만큼만 사용량이 감소한다")
    void detach_memberDrive_decreasesMemberUsage() {
        var member = member();
        member.increaseDriveUsed(300L);
        givenMemberDrive(member);
        when(attachmentFinder.get(ReferenceType.DRIVE, 10L, 1L))
                .thenReturn(attachment(100L));

        manager.detach(USER, 10L, 1L);

        assertThat(member.getDriveUsedBytes()).isEqualTo(200L);
    }

    @Test
    @DisplayName("전체 해제 시 전체 첨부 크기 합만큼 사용량이 감소한다")
    void detachAll_memberDrive_decreasesTotalUsage() {
        var member = member();
        member.increaseDriveUsed(300L);
        var drive = new DriveEntity(DriveType.PERSONAL, null, USER.id(), "드라이브");
        when(memberRepository.findById(USER.id())).thenReturn(Optional.of(member));
        when(attachmentFinder.list(ReferenceType.DRIVE, drive.getId()))
                .thenReturn(List.of(attachment(100L), attachment(200L)));

        manager.detachAll(drive);

        assertThat(member.getDriveUsedBytes()).isEqualTo(0L);
    }

    @Test
    @DisplayName("개인 드라이브 용량 조회는 회원 사용량과 한도를 반환한다")
    void usage_memberDrive_returnsMemberUsage() {
        var member = member();
        member.increaseDriveUsed(300L);
        givenMemberDrive(member);

        var usage = manager.usage(USER, 10L);

        assertThat(usage.usedBytes()).isEqualTo(300L);
        assertThat(usage.limitBytes()).isEqualTo(member.getDriveLimitBytes());
    }

    @Test
    @DisplayName("프로젝트 드라이브 용량 조회는 소유 업체 사용량과 한도를 반환한다")
    void usage_projectDrive_returnsCompanyUsage() {
        var company = company();
        company.increaseDriveUsed(500L);
        givenProjectDrive(company);

        var usage = manager.usage(USER, 10L);

        assertThat(usage.usedBytes()).isEqualTo(500L);
        assertThat(usage.limitBytes()).isEqualTo(company.getDriveLimitBytes());
    }

    private void givenMemberDrive(MemberEntity member) {
        var drive = new DriveEntity(DriveType.PERSONAL, null, USER.id(), "드라이브");
        when(driveFinder.isOwner(USER.id(), 10L)).thenReturn(true);
        when(driveRepository.findById(10L)).thenReturn(Optional.of(drive));
        when(memberRepository.findById(USER.id())).thenReturn(Optional.of(member));
    }

    private void givenProjectDrive(CompanyEntity company) {
        var drive = new DriveEntity(DriveType.PROJECT, 20L, null, "드라이브");
        when(driveFinder.isOwner(USER.id(), 10L)).thenReturn(true);
        when(driveRepository.findById(10L)).thenReturn(Optional.of(drive));
        var project = mock(ProjectEntity.class);
        when(project.getCompanyId()).thenReturn(30L);
        when(projectRepository.findById(20L)).thenReturn(Optional.of(project));
        when(companyRepository.findById(30L)).thenReturn(Optional.of(company));
    }

    private static MemberEntity member() {
        return new MemberEntity("username", "이름", "01000000000", Set.of(Role.CAREER));
    }

    private static CompanyEntity company() {
        return new CompanyEntity(USER.id(), "업체", "1234567890");
    }

    private static Attachment attachment(long size) {
        return new Attachment(
                1L, USER.id(), AttachmentType.FILE, AttachmentStatus.COMPLETED,
                AttachmentContext.DRIVE, 10L, null, null,
                "uuid", "stem", "ext", "application/pdf", size,
                Instant.now(), Instant.now()
        );
    }

    private static Attachment linkedAttachment(long size) {
        return new Attachment(
                1L, USER.id(), AttachmentType.FILE, AttachmentStatus.COMPLETED,
                AttachmentContext.DRIVE, 10L, ReferenceType.DRIVE, 10L,
                "uuid", "stem", "ext", "application/pdf", size,
                Instant.now(), Instant.now()
        );
    }

}
