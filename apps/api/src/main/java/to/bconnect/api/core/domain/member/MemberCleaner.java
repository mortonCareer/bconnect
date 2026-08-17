package to.bconnect.api.core.domain.member;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialRepository;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.storage.retention.TransactionPartyRepository;
import to.bconnect.api.storage.session.SessionRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.chat.ParticipantRepository;

import java.time.Instant;

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
    private final OfferRepository offerRepository;
    private final PostRepository postRepository;
    private final TaskRepository taskRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationRepository notificationRepository;
    private final ParticipantRepository participantRepository;
    private final TransactionPartyRepository transactionPartyRepository;
    private final AttachmentLinker attachmentLinker;
    private final ApiConfigProps apiConfigProps;

    // TODO: 이벤트 구조로 변경 가능
    @Transactional
    public void clean(AuthUser user) {
        val memberId = user.id();

        if (companyRepository.existsByMemberId(memberId))
            throw new CodeException(MemberExceptionCode.WITHDRAW_COMPANY_EXISTS);

        attachmentLinker.unlink(AttachmentReferenceType.MEMBER, memberId);

        val credentials = credentialRepository.findAllByMemberId(memberId);
        attachmentLinker.unlink(AttachmentReferenceType.CREDENTIAL, credentials.stream().map(CredentialEntity::getId).toList());

        val archivedAt = Instant.now();
        val expireAt = archivedAt.plus(apiConfigProps.retention().transactionParty());
        transactionPartyRepository.archiveByWorkerId(memberId, archivedAt, expireAt);

        sessionRepository.purgeByMemberId(memberId);
        profileRepository.purgeTradesByMemberId(memberId);
        profileRepository.purgeByMemberId(memberId);
        credentialRepository.purgeByMemberId(memberId);
        coworkerRepository.purgeByMemberId(memberId);
        coworkerRequestRepository.purgeByMemberId(memberId);
        recommendationRepository.purgeByMemberId(memberId);
        participantRepository.purgeByMemberId(memberId);
        offerRepository.purgeByWorkerId(memberId);
        postRepository.detachWorkerTasksByWorkerId(memberId);
        taskRepository.purgeWorkerTradesByWorkerId(memberId);
        taskRepository.purgeWorkerByWorkerId(memberId);
        deviceTokenRepository.purgeByMemberId(memberId);
        notificationRepository.purgeByMemberId(memberId);
    }
}
