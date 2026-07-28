package to.bconnect.api.core.domain.profile;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.ProfileFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class ProfileResolverTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private ProfileResolver profileResolver;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("get - 프로필이 존재할 때 조회하면 집계 없이 프로필을 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        profileRepository.save(ProfileFactory.entity(member.getId()));

        // when
        val found = profileResolver.get(member.getId());

        // then
        assertThat(found.memberId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("resolveMap - 프로필이 일부만 있을 때 목록을 조회하면 프로필이 있는 회원만 매핑한다")
    void resolveMap_success() {
        // given
        val first = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val second = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        profileRepository.save(ProfileFactory.entity(first.getId()));

        // when
        val resolved = profileResolver.resolveMap(List.of(first.getId(), second.getId()));

        // then
        assertThat(resolved).containsOnlyKeys(first.getId());
    }

    @Test
    @DisplayName("get - 프로필이 없을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // when & then
        assertCodeException(() -> profileResolver.get(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
