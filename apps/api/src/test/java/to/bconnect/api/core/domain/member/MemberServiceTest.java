package to.bconnect.api.core.domain.member;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.fixture.CursorFactory;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.AttachmentFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class MemberServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private MemberService memberService;
    @Autowired private MemberRepository memberRepository;
    @Autowired private AttachmentRepository attachmentRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("get - 회원이 존재할 때 조회하면 회원 정보를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val found = memberService.get(user);

        // then
        assertThat(found.id()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("list - 회원이 여러 명일 때 커서 페이지네이션으로 조회하면 페이지를 반환한다")
    void list_success() {
        // given
        memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val second = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val third = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        val cursor = CursorFactory.request(null, 2);

        // when
        val firstPage = memberService.list(cursor);

        // then
        assertThat(firstPage.content()).hasSize(2);
        assertThat(firstPage.content().get(0).id()).isEqualTo(third.getId());
        assertThat(firstPage.content().get(1).id()).isEqualTo(second.getId());
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isEqualTo(second.getId());
    }

    @Test
    @DisplayName("checkUsername - 사용 중인 사용자명이 없을 때 확인하면 사용 가능을 반환한다")
    void checkUsername_success() {
        // given
        val username = "member1";

        // when
        val unused = memberService.checkUsername(username);

        // then
        assertThat(unused).isTrue();
    }

    @Test
    @DisplayName("checkUsername - 사용자명이 사용 중일 때 확인하면 사용 불가를 반환한다")
    void checkUsername_success_used() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        val used = memberService.checkUsername(member.getUsername());

        // then
        assertThat(used).isFalse();
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
    @DisplayName("update - 회원이 존재할 때 수정하면 이름이 변경된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val command = MemberFactory.updateCommand();
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        memberService.update(user, command);

        // then
        val found = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(found.getName()).isEqualTo(command.name());
    }

    @Test
    @DisplayName("updatePicture - 연결된 첨부가 있을 때 다른 첨부로 변경하면 기존 첨부가 해제되고 새 첨부가 연결된다")
    void updatePicture_success_replace() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val linked = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        linked.complete();
        linked.link(AttachmentReferenceType.MEMBER, member.getId());
        val picture = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        picture.complete();
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        memberService.updatePicture(user, picture.getId());

        // then
        val replaced = attachmentRepository.findById(linked.getId()).orElseThrow();
        assertThat(replaced.getReferenceType()).isNull();
        assertThat(replaced.getReferenceId()).isNull();
        val found = attachmentRepository.findById(picture.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isEqualTo(AttachmentReferenceType.MEMBER);
        assertThat(found.getReferenceId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("updatePicture - 연결된 첨부가 있을 때 프로필 이미지를 미지정하면 첨부 연결이 해제된다")
    void updatePicture_success_unlink() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val linked = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        linked.complete();
        linked.link(AttachmentReferenceType.MEMBER, member.getId());
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        memberService.updatePicture(user, null);

        // then
        val found = attachmentRepository.findById(linked.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
    }

    @Test
    @DisplayName("withdraw - 회원이 존재할 때 탈퇴하면 회원이 삭제된다")
    void withdraw_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        memberService.withdraw(user);
        memberRepository.flush();

        // then
        assertThat(memberRepository.findById(member.getId())).isEmpty();
        val tombstoneCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM members
                WHERE id = ?
                  AND username IS NULL
                  AND name IS NULL
                  AND phone IS NULL
                  AND birth IS NULL
                  AND marketing_consent = false
                  AND deleted_at IS NOT NULL
                """, Integer.class, member.getId());
        assertThat(tombstoneCount).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM member_roles WHERE member_id = ?", Integer.class, member.getId()
        )).isZero();
    }

    @Test
    @DisplayName("get - 회원이 존재하지 않을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> memberService.get(user))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
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
    @DisplayName("register - 만 15세 미만일 때 등록하면 UNDERAGE로 실패한다")
    void register_fail_M004() {
        // given
        val birth = LocalDate.now().minusYears(15).plusDays(1);
        val command = MemberFactory.registerCommand(birth);

        // when & then
        assertCodeException(() -> memberService.register("01000001001", command))
                .hasExceptionCode(MemberExceptionCode.UNDERAGE);
    }

    @Test
    @DisplayName("update - 회원이 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);
        val command = MemberFactory.updateCommand();

        // when & then
        assertCodeException(() -> memberService.update(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
