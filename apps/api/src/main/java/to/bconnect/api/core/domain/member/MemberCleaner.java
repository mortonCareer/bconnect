package to.bconnect.api.core.domain.member;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.drive.DriveService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialRepository;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
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
    private final DriveService driveService;
    private final AttachmentLinker attachmentLinker;

    @Transactional
    public void clean(AuthUser user) {
        val memberId = user.id();

        if (companyRepository.existsByMemberId(memberId))
            throw new CodeException(MemberExceptionCode.WITHDRAW_COMPANY_EXISTS);

        sessionRepository.findByMemberId(memberId).ifPresent(sessionRepository::delete);
        profileRepository.findByMemberId(memberId).ifPresent(profileRepository::delete);

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

        driveMemberRepository.deleteAll(driveMemberRepository.findAllByMemberId(memberId));
        driveRepository.findAllByMemberId(memberId).forEach(it -> driveService.delete(user, it.getId()));
    }
}
