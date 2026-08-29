package to.bconnect.api.core.domain.member;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.attachment.domain.cleanup.AttachmentCleanupService;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.retention.TransactionPartyFinder;
import to.bconnect.api.core.domain.task.TaskService;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.chat.ParticipantRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialRepository;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.otp.OtpRepository;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.storage.retention.RetentionPolicy;
import to.bconnect.api.storage.retention.TransactionPartyEntity;
import to.bconnect.api.storage.retention.TransactionPartyRepository;
import to.bconnect.api.storage.session.SessionRepository;
import to.bconnect.api.storage.signup.SignupTokenRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;

import java.time.Instant;
import java.time.Period;

@Component
@RequiredArgsConstructor
public class MemberCleaner {

    private final CompanyRepository companyRepository;
    private final ApiConfigProps apiConfigProps;
    private final SessionRepository sessionRepository;
    private final OtpRepository otpRepository;
    private final SignupTokenRepository signupTokenRepository;
    private final ProfileRepository profileRepository;
    private final CredentialRepository credentialRepository;
    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository coworkerRequestRepository;
    private final RecommendationRepository recommendationRepository;
    private final OfferRepository offerRepository;
    private final TransactionPartyFinder transactionPartyFinder;
    private final TransactionPartyRepository transactionPartyRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final DriveMemberRepository driveMemberRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationRepository notificationRepository;
    private final ParticipantRepository participantRepository;
    private final AttachmentCleanupService attachmentCleanupService;

    // TODO: 이벤트 구조로 변경 가능
    @Transactional
    public void clean(MemberEntity member) {
        val memberId = member.getId();

        if (companyRepository.existsByMemberId(memberId))
            throw new CodeException(MemberExceptionCode.WITHDRAW_COMPANY_EXISTS);

        val archivedAt = Instant.now();
        val retention = TransactionPartyEntity.class.getAnnotation(RetentionPolicy.class);
        val expireAt = archivedAt.atZone(apiConfigProps.zoneId())
                .plus(Period.parse(retention.value()))
                .toInstant();
        val transactionParties = transactionPartyFinder.findAll(member, archivedAt, expireAt);
        transactionPartyRepository.saveAll(transactionParties);

        sessionRepository.findByMemberId(memberId).ifPresent(it -> it.revoke());
        otpRepository.deleteByPhone(member.getPhone());
        signupTokenRepository.deleteByPhone(member.getPhone());
        profileRepository.findByMemberId(memberId).ifPresent(profileRepository::delete);
        attachmentCleanupService.purge(AttachmentReferenceType.MEMBER, memberId);

        val credentials = credentialRepository.findAllByMemberId(memberId);
        attachmentCleanupService.purge(
                AttachmentReferenceType.CREDENTIAL,
                credentials.stream().map(CredentialEntity::getId).toList()
        );
        credentialRepository.deleteAll(credentials);

        coworkerRepository.deleteAll(coworkerRepository.findAllByMemberId(memberId));
        coworkerRequestRepository.deleteAll(coworkerRequestRepository.findAllByFromId(memberId));
        coworkerRequestRepository.deleteAll(coworkerRequestRepository.findAllByToId(memberId));
        recommendationRepository.deleteAll(recommendationRepository.findAllByFromId(memberId));
        recommendationRepository.deleteAll(recommendationRepository.findAllByToId(memberId));

        participantRepository.deleteAll(participantRepository.findAllByMemberId(memberId));

        offerRepository.deleteAll(offerRepository.findAllByWorkerId(memberId));
        taskRepository.findAllByWorkerIdAndType(memberId, TaskType.WORKER).forEach(taskService::delete);

        deviceTokenRepository.deleteAll(deviceTokenRepository.findAllByMemberId(memberId));
        notificationRepository.deleteAll(notificationRepository.findAllByMemberId(memberId));
        notificationRepository.deleteAll(notificationRepository.findAllBySenderId(memberId));

        driveMemberRepository.deleteAll(driveMemberRepository.findAllByMemberId(memberId));
    }
}
