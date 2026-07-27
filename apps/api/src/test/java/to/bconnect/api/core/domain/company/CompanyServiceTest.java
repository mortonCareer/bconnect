package to.bconnect.api.core.domain.company;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.AttachmentFactory;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

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
        companyRepository.save(new CompanyEntity(first.getId(), "company", "0000001000"));
        val secondCompany = companyRepository.save(new CompanyEntity(second.getId(), "company", "0000001001"));
        val thirdCompany = companyRepository.save(new CompanyEntity(third.getId(), "company", "0000001002"));

        // when
        val firstPage = companyService.list(new CursorLimit(null, 2, null));
        val defaultPage = companyService.list(new CursorLimit(null, null, null));

        // then
        assertThat(firstPage.content()).hasSize(2);
        assertThat(firstPage.content().get(0).id()).isEqualTo(thirdCompany.getId());
        assertThat(firstPage.content().get(1).id()).isEqualTo(secondCompany.getId());
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isEqualTo(secondCompany.getId());

        assertThat(defaultPage.content()).hasSizeLessThanOrEqualTo(20);
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
    @DisplayName("get - 업체가 존재하지 않을 때 식별자로 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // when & then
        assertCodeException(() -> companyService.get(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("get - 내 업체가 존재할 때 조회하면 업체 정보를 반환한다")
    void get_mine_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));

        // when
        val found = companyService.get(UserFactory.domain(member.getId(), Role.PLAN));

        // then
        assertThat(found.id()).isEqualTo(company.getId());
        assertThat(found.memberId()).isEqualTo(member.getId());
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
    @DisplayName("create - 등록 정보가 유효할 때 등록하면 업체가 저장되고 사진이 연결되며 PLAN 권한이 부여된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();

        // when
        val companyId = companyService.create(
                UserFactory.domain(member.getId(), Role.CAREER),
                new CreateCompany("company", "0000001000", attachment.getId())
        );
        val withoutPicture = companyService.create(
                UserFactory.domain(other.getId(), Role.CAREER),
                new CreateCompany("company", "0000001001", null)
        );

        // then
        val created = companyRepository.findById(companyId).orElseThrow();
        assertThat(created.getBrn()).isEqualTo("0000001000");
        val linked = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(linked.getReferenceType()).isEqualTo(ReferenceType.COMPANY);
        assertThat(linked.getReferenceId()).isEqualTo(companyId);
        val granted = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(granted.getRoles()).contains(Role.PLAN);
        assertThat(companyRepository.findById(withoutPicture)).isPresent();
    }

    @Test
    @DisplayName("create - 회원이 존재하지 않을 때 등록하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // when & then
        assertCodeException(() -> companyService.create(
                UserFactory.domain(MISSING_ID, Role.CAREER),
                new CreateCompany("company", "0000001000", null)
        )).hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 이미 업체가 존재할 때 등록하면 ALREADY_EXISTS로 실패한다")
    void create_fail_CO001() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> companyService.create(
                UserFactory.domain(member.getId(), Role.PLAN),
                new CreateCompany("company", "0000001001", null)
        )).hasExceptionCode(CompanyExceptionCode.ALREADY_EXISTS);
    }

    @Test
    @DisplayName("create - 사업자등록번호가 사용 중일 때 등록하면 DUPLICATE_BRN으로 실패한다")
    void create_fail_CO002() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> companyService.create(
                UserFactory.domain(other.getId(), Role.CAREER),
                new CreateCompany("company", company.getBrn(), null)
        )).hasExceptionCode(CompanyExceptionCode.DUPLICATE_BRN);
    }

    @Test
    @DisplayName("update - 사진을 변경하면 기존 첨부가 해제되고 새 첨부가 업체에 연결되며 미지정은 연결을 해제한다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();

        // when
        companyService.update(UserFactory.domain(member.getId(), Role.PLAN), first.getId());
        companyService.update(UserFactory.domain(member.getId(), Role.PLAN), second.getId());
        val replacedReferenceId = attachmentRepository.findById(first.getId()).orElseThrow().getReferenceId();
        val linkedReferenceId = attachmentRepository.findById(second.getId()).orElseThrow().getReferenceId();
        companyService.update(UserFactory.domain(member.getId(), Role.PLAN), null);

        // then
        assertThat(replacedReferenceId).isNull();
        assertThat(linkedReferenceId).isEqualTo(company.getId());
        val found = attachmentRepository.findById(second.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
    }

    @Test
    @DisplayName("update - 업체가 존재하지 않을 때 사진을 변경하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));

        // when & then
        assertCodeException(() -> companyService.update(UserFactory.domain(member.getId(), Role.PLAN), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 업체가 존재할 때 삭제하면 업체가 삭제되고 첨부 참조가 해제되며 PLAN 권한이 회수된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.COMPANY, company.getId());

        // when
        companyService.delete(UserFactory.domain(member.getId(), Role.PLAN));

        // then
        assertThat(companyRepository.findByMemberId(member.getId())).isEmpty();
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
        val revoked = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(revoked.getRoles()).doesNotContain(Role.PLAN);
    }

    @Test
    @DisplayName("delete - 업체가 존재하지 않을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.PLAN));

        // when & then
        assertCodeException(() -> companyService.delete(UserFactory.domain(member.getId(), Role.PLAN)))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
