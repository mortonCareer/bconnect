package to.bconnect.api.core.domain.member;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.MemberFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class MemberResolverTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private MemberResolver memberResolver;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("get - 회원이 존재할 때 조회하면 회원 정보를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        val found = memberResolver.get(member.getId());

        // then
        assertThat(found.id()).isEqualTo(member.getId());
        assertThat(found.username()).isEqualTo("member1");
    }

    @Test
    @DisplayName("get - 회원이 존재하지 않을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // when & then
        assertCodeException(() -> memberResolver.get(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("getOrWithdrawn - 회원을 조회하면 존재하면 회원 정보를 미존재면 탈퇴 회원을 반환한다")
    void getOrWithdrawn_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        val found = memberResolver.getOrWithdrawn(member.getId());
        val withdrawn = memberResolver.getOrWithdrawn(MISSING_ID);

        // then
        assertThat(found.username()).isEqualTo("member1");
        assertThat(withdrawn.id()).isEqualTo(MISSING_ID);
        assertThat(withdrawn.username()).isNull();
    }

    @Test
    @DisplayName("resolveMap - 회원 목록을 조회하면 존재하는 회원만 매핑한다")
    void resolveMap_success() {
        // given
        val first = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        val resolved = memberResolver.resolveMap(List.of(first.getId(), MISSING_ID));

        // then
        assertThat(resolved).containsOnlyKeys(first.getId());
    }

    @Test
    @DisplayName("resolveMapOrWithdrawn - 회원 목록을 조회하면 미존재 회원을 탈퇴 회원으로 채운다")
    void resolveMapOrWithdrawn_success() {
        // given
        val first = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when
        val resolved = memberResolver.resolveMapOrWithdrawn(List.of(first.getId(), MISSING_ID));

        // then
        assertThat(resolved).containsOnlyKeys(first.getId(), MISSING_ID);
        assertThat(resolved.get(MISSING_ID).username()).isNull();
    }
}
