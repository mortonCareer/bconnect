package to.bconnect.api.core.domain.project;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.ProjectFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class ProjectFinderTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private ProjectFinder projectFinder;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("get - 프로젝트가 존재할 때 조회하면 프로젝트를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when
        val found = projectFinder.get(project.getId());

        // then
        assertThat(found.id()).isEqualTo(project.getId());
        assertThat(found.companyId()).isEqualTo(company.getId());
    }

    @Test
    @DisplayName("addressMap - 프로젝트 ID 목록으로 조회하면 존재하는 프로젝트의 주소 맵을 반환한다")
    void addressMap_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val first = projectRepository.save(ProjectFactory.entity(company.getId()));
        val second = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when
        val response = projectFinder.addressMap(List.of(first.getId(), second.getId(), MISSING_ID));

        // then
        assertThat(response).containsOnlyKeys(first.getId(), second.getId());
        assertThat(response.get(first.getId()).getZipcode()).isEqualTo(first.getAddress().getZipcode());
    }

    @Test
    @DisplayName("companyMap - 프로젝트 ID 목록으로 조회하면 업체가 존재하는 프로젝트의 업체 맵을 반환한다")
    void companyMap_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when
        val response = projectFinder.companyMap(List.of(project.getId(), MISSING_ID));

        // then
        assertThat(response).containsOnlyKeys(project.getId());
        assertThat(response.get(project.getId()).id()).isEqualTo(company.getId());
    }

    @Test
    @DisplayName("validateOwnership - 소유한 업체의 프로젝트일 때 검증하면 예외가 발생하지 않는다")
    void validateOwnership_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when & then
        assertThatCode(() -> projectFinder.validateOwnership(member.getId(), project.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("isOwner - 소유한 업체의 프로젝트일 때 소유 여부를 조회하면 true를 반환한다")
    void isOwner_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when
        val owned = projectFinder.isOwner(member.getId(), project.getId());

        // then
        assertThat(owned).isTrue();
    }

    @Test
    @DisplayName("isOwner - 다른 업체의 프로젝트일 때 소유 여부를 조회하면 false를 반환한다")
    void isOwner_success_other() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));

        // when
        val owned = projectFinder.isOwner(other.getId(), project.getId());

        // then
        assertThat(owned).isFalse();
    }

    @Test
    @DisplayName("isOwner - 소유한 업체가 없을 때 소유 여부를 조회하면 false를 반환한다")
    void isOwner_success_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when
        val owned = projectFinder.isOwner(other.getId(), project.getId());

        // then
        assertThat(owned).isFalse();
    }

    @Test
    @DisplayName("isOwner - 프로젝트가 존재하지 않을 때 소유 여부를 조회하면 false를 반환한다")
    void isOwner_success_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when
        val owned = projectFinder.isOwner(member.getId(), MISSING_ID);

        // then
        assertThat(owned).isFalse();
    }

    @Test
    @DisplayName("get - 프로젝트가 존재하지 않을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // when & then
        assertCodeException(() -> projectFinder.get(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("validateOwnership - 다른 업체의 프로젝트일 때 검증하면 FORBIDDEN으로 실패한다")
    void validateOwnership_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));

        // when & then
        assertCodeException(() -> projectFinder.validateOwnership(other.getId(), project.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }
}
