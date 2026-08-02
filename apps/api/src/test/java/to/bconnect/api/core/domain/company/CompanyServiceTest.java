package to.bconnect.api.core.domain.company;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class CompanyServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private CompanyService companyService;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private AttachmentRepository attachmentRepository;

    @Test
    @DisplayName("list - 업체 목록을 커서 페이지네이션 조회하면 페이지를 반환한다")
    void list_success() {
        // given
        val first = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val second = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.PLAN));
        val third = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.PLAN));
        companyRepository.save(CompanyFactory.entity(first.getId(), "0000001000"));
        val secondCompany = companyRepository.save(CompanyFactory.entity(second.getId(), "0000001001"));
        val thirdCompany = companyRepository.save(CompanyFactory.entity(third.getId(), "0000001002"));
        val cursor = CursorFactory.request(null, 2);

        // when
        val firstPage = companyService.list(cursor);

        // then
        assertThat(firstPage.content()).hasSize(2);
        assertThat(firstPage.content().get(0).id()).isEqualTo(thirdCompany.getId());
        assertThat(firstPage.content().get(1).id()).isEqualTo(secondCompany.getId());
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isEqualTo(secondCompany.getId());
    }

    @Test
    @DisplayName("get - 업체가 존재할 때 식별자로 조회하면 업체 정보를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));

        // when
        val found = companyService.get(company.getId());

        // then
        assertThat(found.id()).isEqualTo(company.getId());
        assertThat(found.brn()).isEqualTo(company.getBrn());
    }

    @Test
    @DisplayName("get - 내 업체가 존재할 때 조회하면 업체 정보를 반환한다")
    void get_mine_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.PLAN);

        // when
        val found = companyService.get(user);

        // then
        assertThat(found.id()).isEqualTo(company.getId());
        assertThat(found.memberId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("create - 사진을 지정해 등록하면 업체가 저장되고 사진이 연결되며 PLAN 권한이 부여된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = CompanyFactory.command("0000001000", attachment.getId());

        // when
        val companyId = companyService.create(user, command);

        // then
        val created = companyRepository.findById(companyId).orElseThrow();
        assertThat(created.getBrn()).isEqualTo("0000001000");
        val linked = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(linked.getReferenceType()).isEqualTo(AttachmentReferenceType.COMPANY);
        assertThat(linked.getReferenceId()).isEqualTo(companyId);
        val granted = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(granted.getRoles()).contains(Role.PLAN);
    }

    @Test
    @DisplayName("update - 연결된 사진이 없을 때 사진을 변경하면 새 첨부가 업체에 연결된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        val user = UserFactory.domain(member.getId(), Role.PLAN);

        // when
        companyService.update(user, attachment.getId());

        // then
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isEqualTo(AttachmentReferenceType.COMPANY);
        assertThat(found.getReferenceId()).isEqualTo(company.getId());
    }

    @Test
    @DisplayName("update - 사진이 연결되어 있을 때 다른 사진으로 변경하면 기존 첨부가 해제되고 새 첨부가 연결된다")
    void update_success_replace() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        first.link(AttachmentReferenceType.COMPANY, company.getId());
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();
        val user = UserFactory.domain(member.getId(), Role.PLAN);

        // when
        companyService.update(user, second.getId());

        // then
        val replaced = attachmentRepository.findById(first.getId()).orElseThrow();
        assertThat(replaced.getReferenceType()).isNull();
        assertThat(replaced.getReferenceId()).isNull();
        val linked = attachmentRepository.findById(second.getId()).orElseThrow();
        assertThat(linked.getReferenceType()).isEqualTo(AttachmentReferenceType.COMPANY);
        assertThat(linked.getReferenceId()).isEqualTo(company.getId());
    }

    @Test
    @DisplayName("update - 사진이 연결되어 있을 때 사진을 미지정하면 첨부 연결이 해제된다")
    void update_success_unlink() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(AttachmentReferenceType.COMPANY, company.getId());
        val user = UserFactory.domain(member.getId(), Role.PLAN);

        // when
        companyService.update(user, null);

        // then
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
    }

    @Test
    @DisplayName("delete - 업체가 존재할 때 삭제하면 업체가 삭제되고 첨부 참조가 해제되며 PLAN 권한이 회수된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(AttachmentReferenceType.COMPANY, company.getId());
        val user = UserFactory.domain(member.getId(), Role.PLAN);

        // when
        companyService.delete(user);

        // then
        assertThat(companyRepository.findByMemberId(member.getId())).isEmpty();
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
        val revoked = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(revoked.getRoles()).doesNotContain(Role.PLAN);
    }

    @Test
    @DisplayName("get - 업체가 존재하지 않을 때 식별자로 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // when & then
        assertCodeException(() -> companyService.get(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("get - 내 업체가 존재하지 않을 때 조회하면 NOT_FOUND로 실패한다")
    void get_mine_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.PLAN);

        // when & then
        assertCodeException(() -> companyService.get(user))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 회원이 존재하지 않을 때 등록하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);
        val command = CompanyFactory.command("0000001000");

        // when & then
        assertCodeException(() -> companyService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 이미 업체가 존재할 때 등록하면 ALREADY_EXISTS로 실패한다")
    void create_fail_CO001() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.PLAN);
        val command = CompanyFactory.command("0000001001");

        // when & then
        assertCodeException(() -> companyService.create(user, command))
                .hasExceptionCode(CompanyExceptionCode.ALREADY_EXISTS);
    }

    @Test
    @DisplayName("create - 사업자등록번호가 사용 중일 때 등록하면 DUPLICATE_BRN으로 실패한다")
    void create_fail_CO002() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(other.getId(), Role.CAREER);
        val command = CompanyFactory.command(company.getBrn());

        // when & then
        assertCodeException(() -> companyService.create(user, command))
                .hasExceptionCode(CompanyExceptionCode.DUPLICATE_BRN);
    }

    @Test
    @DisplayName("update - 업체가 존재하지 않을 때 사진을 변경하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val user = UserFactory.domain(member.getId(), Role.PLAN);

        // when & then
        assertCodeException(() -> companyService.update(user, null))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 업체가 존재하지 않을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val user = UserFactory.domain(member.getId(), Role.PLAN);

        // when & then
        assertCodeException(() -> companyService.delete(user))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
