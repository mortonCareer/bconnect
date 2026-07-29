package to.bconnect.api.core.domain.profile;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.ProfileFactory;
import to.bconnect.api.support.fixture.UserFactory;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class ProfileServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private ProfileService profileService;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("create - 회원이 존재할 때 프로필을 생성하면 프로필이 저장되고 CAREER 권한이 부여된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.GUEST));
        val command = ProfileFactory.createCommand();
        val user = UserFactory.domain(member.getId(), Role.GUEST);

        // when
        val created = profileService.create(user, command);

        // then
        val found = profileRepository.findById(created).orElseThrow();
        assertThat(found.getMemberId()).isEqualTo(member.getId());
        val granted = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(granted.getRoles()).contains(Role.CAREER).doesNotContain(Role.GUEST);
    }

    @Test
    @DisplayName("update - 프로필이 존재할 때 수정하면 프로필이 갱신된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val profile = profileRepository.save(ProfileFactory.entity(member.getId()));
        val command = ProfileFactory.updateCommand();
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        profileService.update(user, command);

        // then
        val found = profileRepository.findById(profile.getId()).orElseThrow();
        assertThat(found.getTrades()).containsExactlyInAnyOrderElementsOf(command.trades());
        assertThat(found.getExperience()).isEqualTo(command.experience());
    }

    @Test
    @DisplayName("updateAbout - 프로필이 존재할 때 자기소개를 수정하면 자기소개가 갱신된다")
    void updateAbout_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val profile = profileRepository.save(ProfileFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        profileService.updateAbout(user, "updated about");

        // then
        val found = profileRepository.findById(profile.getId()).orElseThrow();
        assertThat(found.getAbout()).isEqualTo("updated about");
    }

    @Test
    @DisplayName("create - 회원이 존재하지 않을 때 프로필을 생성하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);
        val command = ProfileFactory.createCommand();

        // when & then
        assertCodeException(() -> profileService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 프로필이 이미 있을 때 생성하면 ALREADY_EXISTS로 실패한다")
    void create_fail_P001() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        profileRepository.save(ProfileFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = ProfileFactory.createCommand();

        // when & then
        assertCodeException(() -> profileService.create(user, command))
                .hasExceptionCode(ProfileExceptionCode.ALREADY_EXISTS);
    }

    @Test
    @DisplayName("create - 대표 공종이 선택 공종에 없을 때 생성하면 INVALID_PRIMARY_TRADE로 실패한다")
    void create_fail_P002() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val command = new CreateProfile(ProfileRole.FOREMAN, Trade.PLUMBING, Set.of(Trade.ELECTRICAL),
                5, "headline", "about", ProfileFactory.DEFAULT_ADDRESS);
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> profileService.create(user, command))
                .hasExceptionCode(ProfileExceptionCode.INVALID_PRIMARY_TRADE);
    }

    @Test
    @DisplayName("update - 프로필이 없을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = ProfileFactory.updateCommand();

        // when & then
        assertCodeException(() -> profileService.update(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("update - 대표 공종이 선택 공종에 없을 때 수정하면 INVALID_PRIMARY_TRADE로 실패한다")
    void update_fail_P002() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        profileRepository.save(ProfileFactory.entity(member.getId()));
        val command = new UpdateProfile(ProfileRole.FOREMAN, Trade.PLUMBING, Set.of(Trade.ELECTRICAL),
                5, "headline", ProfileFactory.DEFAULT_ADDRESS);
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> profileService.update(user, command))
                .hasExceptionCode(ProfileExceptionCode.INVALID_PRIMARY_TRADE);
    }

    @Test
    @DisplayName("updateAbout - 프로필이 없을 때 자기소개를 수정하면 NOT_FOUND로 실패한다")
    void updateAbout_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> profileService.updateAbout(user, "updated about"))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
