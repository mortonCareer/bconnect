package to.bconnect.api.core.domain.member;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialRepository;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.drive.DriveEntity;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.storage.session.SessionRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;

@Component
@RequiredArgsConstructor
public class MemberCleaner {

    private final CompanyRepository companyRepository;
    private final SessionRepository sessionRepository;
    private final ProfileRepository profileRepository;
    private final CredentialRepository credentialRepository;
    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository coworkerRequestRepository;
    private final RecommendationRepository recommendationRepository;
    private final PostRepository postRepository;
    private final OfferRepository offerRepository;
    private final TaskRepository taskRepository;
    private final DriveRepository driveRepository;
    private final DriveMemberRepository driveMemberRepository;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationRepository notificationRepository;
    private final AttachmentLinker attachmentLinker;

    // TODO: 이벤트 구조로 변경 가능
    @Transactional
    public void clean(AuthUser user) {
        val memberId = user.id();

        if (companyRepository.existsByMemberId(memberId))
            throw new CodeException(MemberExceptionCode.WITHDRAW_COMPANY_EXISTS);

        sessionRepository.findByMemberId(memberId).ifPresent(sessionRepository::delete);
        profileRepository.findByMemberId(memberId).ifPresent(profileRepository::delete);
        attachmentLinker.unlink(ReferenceType.MEMBER, memberId);

        val credentials = credentialRepository.findAllByMemberId(memberId);
        attachmentLinker.unlink(ReferenceType.CREDENTIAL, credentials.stream().map(CredentialEntity::getId).toList());
        credentialRepository.deleteAll(credentials);

        coworkerRepository.deleteAll(coworkerRepository.findAllByMemberId(memberId));
        coworkerRequestRepository.deleteAll(coworkerRequestRepository.findAllByFromId(memberId));
        coworkerRequestRepository.deleteAll(coworkerRequestRepository.findAllByToId(memberId));
        recommendationRepository.deleteAll(recommendationRepository.findAllByFromId(memberId));
        recommendationRepository.deleteAll(recommendationRepository.findAllByToId(memberId));

        val posts = postRepository.findAllByMemberId(memberId);
        attachmentLinker.unlink(ReferenceType.POST, posts.stream().map(PostEntity::getId).toList());
        postRepository.deleteAll(posts);

        offerRepository.deleteAll(offerRepository.findAllByWorkerId(memberId));
        taskRepository.deleteAll(taskRepository.findAllByWorkerIdAndType(memberId, TaskType.WORKER));

        deviceTokenRepository.deleteAll(deviceTokenRepository.findAllByMemberId(memberId));
        notificationRepository.deleteAll(notificationRepository.findAllByReceiverId(memberId));
        notificationRepository.deleteAll(notificationRepository.findAllBySenderId(memberId));

        driveMemberRepository.deleteAll(driveMemberRepository.findAllByMemberId(memberId));

        val drives = driveRepository.findAllByMemberId(memberId);
        drives.forEach(it -> boardRepository.findByDriveId(it.getId()).ifPresent(board -> {
            noteRepository.deleteAllByBoardId(board.getId());
            boardRepository.delete(board);
        }));
        attachmentLinker.unlink(ReferenceType.DRIVE, drives.stream().map(DriveEntity::getId).toList());
        drives.forEach(it -> driveMemberRepository.deleteByDriveId(it.getId()));
        driveRepository.deleteAll(drives);
    }
}
