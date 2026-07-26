package to.bconnect.api.core.domain.member;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.attachment.domain.AttachmentExceptionCode;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.AttachmentFactory;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class MemberServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private MemberService memberService;
    @Autowired private MemberRepository memberRepository;
    @Autowired private AttachmentRepository attachmentRepository;
    @Autowired private CompanyRepository companyRepository;

    @Test
    @DisplayName("get - 회원이 존재할 때 회원 정보를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        val found = memberService.get(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        assertThat(found.id()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("get - 회원이 존재하지 않을 때 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> memberService.get(user))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("list - 회원 목록을 커서 페이지네이션 조회하면 페이지를 반환한다")
    void list_success() {
        // given
        memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val second = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val third = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));

        // when
        val firstPage = memberService.list(new CursorLimit(null, 2, null));
        val defaultPage = memberService.list(new CursorLimit(null, null, null));

        // then
        assertThat(firstPage.content()).hasSize(2);
        assertThat(firstPage.content().get(0).id()).isEqualTo(third.getId());
        assertThat(firstPage.content().get(1).id()).isEqualTo(second.getId());
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isEqualTo(second.getId());

        assertThat(defaultPage.content()).hasSizeLessThanOrEqualTo(20);
    }

    @Test
    @DisplayName("checkUsername - 사용자명의 사용 가능 여부를 반환한다")
    void checkUsername_success() {
        // given
        memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        val used = memberService.checkUsername("member1");
        val unused = memberService.checkUsername("member2");

        // then
        assertThat(used).isFalse();
        assertThat(unused).isTrue();
    }

    @Test
    @DisplayName("register - 가입 정보가 유효할 때 등록하면 회원이 저장된다")
    void register_success() {
        // given
        val command = MemberFactory.registerCommand();

        // when
        val registered = memberService.register("01000001001", command);

        // then
        val found = memberRepository.findById(registered.id()).orElseThrow();
        assertThat(found.getUsername()).isEqualTo(command.username());
    }

    @Test
    @DisplayName("register - 사용자명이 사용 중일 때 등록하면 DUPLICATE_USERNAME으로 실패한다")
    void register_fail_M001() {
        // given
        val command = MemberFactory.registerCommand();
        memberRepository.save(MemberFactory.entity(command.username(), "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> memberService.register("01000001002", command))
                .hasExceptionCode(MemberExceptionCode.DUPLICATE_USERNAME);
    }

    @Test
    @DisplayName("register - 전화번호가 사용 중일 때 등록하면 DUPLICATE_PHONE으로 실패한다")
    void register_fail_M002() {
        // given
        val command = MemberFactory.registerCommand();
        memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> memberService.register("01000001001", command))
                .hasExceptionCode(MemberExceptionCode.DUPLICATE_PHONE);
    }

    @Test
    @DisplayName("update - 회원이 존재할 때 이름을 수정할 수 있다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        memberService.update(UserFactory.domain(member.getId(), Role.CAREER), MemberFactory.updateCommand());

        // then
        val found = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(found.getUsername()).isEqualTo("member1");
    }

    @Test
    @DisplayName("update - 회원이 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> memberService.update(user, MemberFactory.updateCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updatePicture - 본인이 첨부한 프로필 이미지로 변경한다")
    void updatePicture_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();

        // when
        memberService.updatePicture(UserFactory.domain(member.getId(), Role.CAREER), attachment.getId());
        memberService.updatePicture(UserFactory.domain(member.getId(), Role.CAREER), attachment.getId());
        memberService.updatePicture(UserFactory.domain(member.getId(), Role.CAREER), null);

        // then
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isEqualTo(ReferenceType.MEMBER);
        assertThat(found.getReferenceId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("updatePicture - 타인의 첨부일 때 사진을 변경하면 FORBIDDEN으로 실패한다")
    void updatePicture_fail_C004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(other.getId(), other.getId()));
        attachment.complete();

        // when & then
        assertCodeException(() -> memberService.updatePicture(UserFactory.domain(member.getId(), Role.CAREER), attachment.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("updatePicture - 첨부가 존재하지 않을 때 사진을 변경하면 NOT_FOUND로 실패한다")
    void updatePicture_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> memberService.updatePicture(UserFactory.domain(member.getId(), Role.CAREER), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updatePicture - 첨부 업로드가 완료되지 않았을 때 사진을 변경하면 NOT_COMPLETED로 실패한다")
    void updatePicture_fail_AT004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when & then
        assertCodeException(() -> memberService.updatePicture(UserFactory.domain(member.getId(), Role.CAREER), attachment.getId()))
                .hasExceptionCode(AttachmentExceptionCode.NOT_COMPLETED);
    }

    @Test
    @DisplayName("updatePicture - 첨부가 다른 참조에 연결되어 있을 때 사진을 변경하면 INVALID_LINKED로 실패한다")
    void updatePicture_fail_AT005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, 1L);

        // when & then
        assertCodeException(() -> memberService.updatePicture(UserFactory.domain(member.getId(), Role.CAREER), attachment.getId()))
                .hasExceptionCode(AttachmentExceptionCode.INVALID_LINKED);
    }

    @Test
    @DisplayName("withdraw - 회원이 존재할 때 탈퇴하면 회원이 삭제되고 첨부 참조가 해제된다")
    void withdraw_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.MEMBER, member.getId());

        // when
        memberService.withdraw(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        assertThat(memberRepository.findById(member.getId())).isEmpty();
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
        assertThatCode(() -> memberService.withdraw(UserFactory.domain(MISSING_ID, Role.CAREER)))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("withdraw - 소유한 업체가 있을 때 탈퇴하면 WITHDRAW_COMPANY_EXISTS로 실패한다")
    void withdraw_fail_M003() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> memberService.withdraw(UserFactory.domain(member.getId(), Role.CAREER)))
                .hasExceptionCode(MemberExceptionCode.WITHDRAW_COMPANY_EXISTS);
    }
}
