package to.bconnect.api.core.domain.member;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.chat.GroupChatRepository;
import to.bconnect.api.storage.chat.ParticipantRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.credential.CredentialRepository;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.storage.session.SessionRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.AttachmentFactory;
import to.bconnect.api.support.fixture.BoardFactory;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.CoworkerFactory;
import to.bconnect.api.support.fixture.CoworkerRequestFactory;
import to.bconnect.api.support.fixture.CredentialFactory;
import to.bconnect.api.support.fixture.DriveFactory;
import to.bconnect.api.support.fixture.GroupChatFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.ParticipantFactory;
import to.bconnect.api.support.fixture.OfferFactory;
import to.bconnect.api.support.fixture.PostFactory;
import to.bconnect.api.support.fixture.ProfileFactory;
import to.bconnect.api.support.fixture.RecommendationFactory;
import to.bconnect.api.support.fixture.SessionFactory;
import to.bconnect.api.support.fixture.TaskFactory;
import to.bconnect.api.support.fixture.UserFactory;


import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class MemberCleanerTest {

    @Autowired private MemberCleaner memberCleaner;
    @Autowired private MemberRepository memberRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private CredentialRepository credentialRepository;
    @Autowired private CoworkerRepository coworkerRepository;
    @Autowired private CoworkerRequestRepository coworkerRequestRepository;
    @Autowired private RecommendationRepository recommendationRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private OfferRepository offerRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private DriveRepository driveRepository;
    @Autowired private DriveMemberRepository driveMemberRepository;
    @Autowired private BoardRepository boardRepository;
    @Autowired private NoteRepository noteRepository;
    @Autowired private AttachmentRepository attachmentRepository;
    @Autowired private GroupChatRepository groupChatRepository;
    @Autowired private ParticipantRepository participantRepository;
    @Autowired private GroupChatFactory groupChatFactory;
    @Autowired private ParticipantFactory participantFactory;

    @Test
    @DisplayName("clean - 연관 데이터가 있을 때 정리하면 연관 데이터가 삭제된다")
    void clean_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        sessionRepository.save(SessionFactory.entity(member.getId()));
        profileRepository.save(ProfileFactory.entity(member.getId()));
        val credential = credentialRepository.save(CredentialFactory.entity(member.getId()));
        coworkerRepository.save(CoworkerFactory.entity(member.getId(), other.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(member.getId(), other.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(other.getId(), member.getId()));
        recommendationRepository.save(RecommendationFactory.entity(member.getId(), other.getId()));
        recommendationRepository.save(RecommendationFactory.entity(other.getId(), member.getId()));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        val post = postRepository.save(PostFactory.entity(member.getId(), task.getId()));
        offerRepository.save(OfferFactory.entity(task.getId(), member.getId()));
        val chat = groupChatFactory.entity();
        participantFactory.entity(chat.getId(), member.getId());
        participantFactory.entity(chat.getId(), other.getId());
        val soloChat = groupChatFactory.entity();
        participantFactory.entity(soloChat.getId(), member.getId());
        val projectTask = taskRepository.save(TaskFactory.projectEntity(null, member.getId()));
        val drive = driveRepository.save(DriveFactory.entity(null, member.getId()));
        val board = boardRepository.save(BoardFactory.driveEntity(drive.getId()));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        driveMemberRepository.save(DriveFactory.memberEntity(drive.getId(), member.getId()));

        val memberAttachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        memberAttachment.complete();
        memberAttachment.link(AttachmentReferenceType.MEMBER, member.getId());
        val credentialAttachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        credentialAttachment.complete();
        credentialAttachment.link(AttachmentReferenceType.CREDENTIAL, credential.getId());
        val postAttachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        postAttachment.complete();
        postAttachment.link(AttachmentReferenceType.POST, post.getId());
        val driveAttachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        driveAttachment.complete();
        driveAttachment.link(AttachmentReferenceType.DRIVE, drive.getId());

        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        memberCleaner.clean(user);

        // then
        assertThat(sessionRepository.findByMemberId(member.getId())).isEmpty();
        assertThat(profileRepository.findByMemberId(member.getId())).isEmpty();
        assertThat(credentialRepository.findAllByMemberId(member.getId())).isEmpty();
        assertThat(coworkerRepository.findAllByMemberId(member.getId())).isEmpty();
        assertThat(coworkerRequestRepository.findAllByFromId(member.getId())).isEmpty();
        assertThat(coworkerRequestRepository.findAllByToId(member.getId())).isEmpty();
        assertThat(recommendationRepository.findAllByFromId(member.getId())).isEmpty();
        assertThat(recommendationRepository.findAllByToId(member.getId())).isEmpty();
        assertThat(postRepository.findById(post.getId())).isPresent();
        assertThat(participantRepository.findByChatIdAndMemberId(chat.getId(), member.getId())).isEmpty();
        assertThat(groupChatRepository.findById(chat.getId())).isPresent();
        assertThat(groupChatRepository.findById(soloChat.getId())).isEmpty();
        assertThat(offerRepository.findAllByWorkerId(member.getId())).isEmpty();
        assertThat(taskRepository.findAllByWorkerIdAndType(member.getId(), TaskType.WORKER)).isEmpty();
        assertThat(taskRepository.findById(projectTask.getId())).isPresent();
        assertThat(driveRepository.findAllByMemberId(member.getId())).isEmpty();
        assertThat(boardRepository.findByDriveId(drive.getId())).isEmpty();
        assertThat(noteRepository.findById(note.getId())).isEmpty();
        assertThat(driveMemberRepository.findAllByMemberId(member.getId())).isEmpty();

        assertThat(attachmentRepository.findById(memberAttachment.getId()).orElseThrow().getReferenceId()).isNull();
        assertThat(attachmentRepository.findById(credentialAttachment.getId()).orElseThrow().getReferenceId()).isNull();
        assertThat(attachmentRepository.findById(postAttachment.getId()).orElseThrow().getReferenceId()).isEqualTo(post.getId());
        assertThat(attachmentRepository.findById(driveAttachment.getId()).orElseThrow().getReferenceId()).isNull();
    }

    @Test
    @DisplayName("clean - 소유한 업체가 있을 때 정리하면 WITHDRAW_COMPANY_EXISTS로 실패한다")
    void clean_fail_M003() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> memberCleaner.clean(user))
                .hasExceptionCode(MemberExceptionCode.WITHDRAW_COMPANY_EXISTS);
    }
}
