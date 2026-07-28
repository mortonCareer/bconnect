package to.bconnect.api.core.domain.credential;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.credential.CredentialRepository;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.storage.credential.CredentialType;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.AttachmentFactory;
import to.bconnect.api.support.fixture.CredentialFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;
import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE;

@IntegrationTest
class CredentialServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private CredentialService credentialService;
    @Autowired private CredentialRepository credentialRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private AttachmentRepository attachmentRepository;

    @Test
    @DisplayName("list - 회원의 자격 증빙이 존재할 때 목록을 조회하면 본인 증빙만 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val first = credentialRepository.save(CredentialFactory.entity(member.getId()));
        val second = credentialRepository.save(CredentialFactory.entity(member.getId(), CredentialType.CAREER_CERTIFICATE));
        credentialRepository.save(CredentialFactory.entity(other.getId()));

        // when
        val response = credentialService.list(member.getId());

        // then
        assertThat(response).extracting(Credential::id)
                .containsExactlyInAnyOrder(first.getId(), second.getId());
    }

    @Test
    @DisplayName("listLatestAccepted - 승인된 증빙이 여러 건일 때 조회하면 유형별 최신 승인 증빙만 반환한다")
    void listLatestAccepted_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val old = credentialRepository.save(CredentialFactory.entity(member.getId()));
        old.accept();
        val latest = credentialRepository.save(CredentialFactory.entity(member.getId()));
        latest.accept();
        val certificate = credentialRepository.save(CredentialFactory.entity(member.getId(), CredentialType.CAREER_CERTIFICATE));
        certificate.accept();
        credentialRepository.save(CredentialFactory.entity(member.getId(), CredentialType.SKILL_GRADE_CERTIFICATE));
        val denied = credentialRepository.save(CredentialFactory.entity(member.getId(), CredentialType.OTHER_CERTIFICATE));
        denied.deny();

        // when
        val response = credentialService.listLatestAccepted(member.getId());

        // then
        assertThat(response).extracting(Credential::id)
                .containsExactlyInAnyOrder(latest.getId(), certificate.getId());
    }

    @Test
    @DisplayName("create - 첨부를 지정해 등록하면 증빙이 PENDING으로 저장되고 첨부가 연결된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = new CreateCredential(CredentialType.CAREER_CERTIFICATE, MAX_DATE, "note", attachment.getId());

        // when
        val credentialId = credentialService.create(user, command);

        // then
        val created = credentialRepository.findById(credentialId).orElseThrow();
        assertThat(created.getMemberId()).isEqualTo(member.getId());
        assertThat(created.getStatus()).isEqualTo(CredentialStatus.PENDING);
        val linked = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(linked.getReferenceType()).isEqualTo(ReferenceType.CREDENTIAL);
        assertThat(linked.getReferenceId()).isEqualTo(credentialId);
    }

    @Test
    @DisplayName("delete - 본인 증빙일 때 삭제하면 증빙이 삭제되고 첨부 참조가 해제된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val credential = credentialRepository.save(CredentialFactory.entity(member.getId()));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.CREDENTIAL, credential.getId());
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        credentialService.delete(user, credential.getId());

        // then
        assertThat(credentialRepository.findById(credential.getId())).isEmpty();
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
    }

    @Test
    @DisplayName("accept - 대기 중인 증빙일 때 승인하면 상태가 ACCEPTED로 변경된다")
    void accept_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val credential = credentialRepository.save(CredentialFactory.entity(member.getId()));

        // when
        credentialService.accept(credential.getId());

        // then
        val found = credentialRepository.findById(credential.getId()).orElseThrow();
        assertThat(found.getStatus()).isEqualTo(CredentialStatus.ACCEPTED);
    }

    @Test
    @DisplayName("deny - 대기 중인 증빙일 때 반려하면 상태가 DENIED로 변경된다")
    void deny_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val credential = credentialRepository.save(CredentialFactory.entity(member.getId()));

        // when
        credentialService.deny(credential.getId());

        // then
        val found = credentialRepository.findById(credential.getId()).orElseThrow();
        assertThat(found.getStatus()).isEqualTo(CredentialStatus.DENIED);
    }

    @Test
    @DisplayName("delete - 다른 회원의 증빙일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val credential = credentialRepository.save(CredentialFactory.entity(owner.getId()));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> credentialService.delete(user, credential.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
        assertThat(credentialRepository.findById(credential.getId())).isPresent();
    }

    @Test
    @DisplayName("accept - 증빙이 존재하지 않을 때 승인하면 NOT_FOUND로 실패한다")
    void accept_fail_C005() {
        // when & then
        assertCodeException(() -> credentialService.accept(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("accept - 이미 처리된 증빙일 때 승인하면 INVALID_STATUS로 실패한다")
    void accept_fail_CD001() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val credential = credentialRepository.save(CredentialFactory.entity(member.getId()));
        credential.accept();

        // when & then
        assertCodeException(() -> credentialService.accept(credential.getId()))
                .hasExceptionCode(CredentialExceptionCode.INVALID_STATUS);
    }

    @Test
    @DisplayName("deny - 증빙이 존재하지 않을 때 반려하면 NOT_FOUND로 실패한다")
    void deny_fail_C005() {
        // when & then
        assertCodeException(() -> credentialService.deny(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("deny - 이미 처리된 증빙일 때 반려하면 INVALID_STATUS로 실패한다")
    void deny_fail_CD001() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val credential = credentialRepository.save(CredentialFactory.entity(member.getId()));
        credential.deny();

        // when & then
        assertCodeException(() -> credentialService.deny(credential.getId()))
                .hasExceptionCode(CredentialExceptionCode.INVALID_STATUS);
    }
}
