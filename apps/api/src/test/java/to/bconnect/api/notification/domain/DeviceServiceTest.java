package to.bconnect.api.notification.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.DeviceFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class DeviceServiceTest {

    @Autowired private DeviceService deviceService;
    @Autowired private DeviceTokenRepository deviceTokenRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("list - 활성·비활성 device가 있을 때 조회하면 활성 device만 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val enabled = deviceTokenRepository.save(DeviceFactory.entity(member.getId(), DevicePlatform.web));
        val disabled = deviceTokenRepository.save(DeviceFactory.entity(member.getId(), DevicePlatform.android));
        disabled.disable();
        deviceTokenRepository.save(DeviceFactory.entity(other.getId(), DevicePlatform.web));

        // when
        val response = deviceService.list(member.getId());

        // then
        assertThat(response).extracting(DeviceTokenEntity::getId).containsExactly(enabled.getId());
    }

    @Test
    @DisplayName("register - 신규 토큰일 때 등록하면 device가 저장된다")
    void register_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val token = "token-register-new";

        // when
        deviceService.register(user, token, DevicePlatform.web);

        // then
        val created = deviceTokenRepository.findByToken(token).orElseThrow();
        assertThat(created.getMemberId()).isEqualTo(member.getId());
        assertThat(created.getToken()).isEqualTo(token);
    }

    @Test
    @DisplayName("register - 이미 등록된 토큰일 때 등록하면 소유 회원과 활성 여부가 갱신된다")
    void register_success_refresh() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = deviceTokenRepository.save(DeviceFactory.entity(other.getId(), DevicePlatform.web));
        created.disable();
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        deviceService.register(user, created.getToken(), DevicePlatform.web);

        // then
        val found = deviceTokenRepository.findById(created.getId()).orElseThrow();
        assertThat(found.getMemberId()).isEqualTo(member.getId());
        assertThat(found.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("unregister - 등록된 토큰일 때 해제하면 device가 제거된다")
    void unregister_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val created = deviceTokenRepository.save(DeviceFactory.entity(member.getId(), DevicePlatform.web));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        deviceService.unregister(user, created.getToken());

        // then
        assertThat(deviceTokenRepository.findById(created.getId())).isEmpty();
    }
}
