package to.bconnect.api.notification.domain.target;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.notification.domain.MemberFirstDeviceRegisteredEvent;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.storage.profile.ProfileRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProfileCompletionTargetResolverTest {

    private static final Long MEMBER = 7L;

    @Test
    @DisplayName("supports 는 PROFILE_COMPLETION")
    void supports() {
        var resolver = new ProfileCompletionTargetResolver(mock(ProfileRepository.class));
        assertThat(resolver.supports()).isEqualTo(NotificationType.PROFILE_COMPLETION);
    }

    @Test
    @DisplayName("프로필이 없으면(미완성) 본인을 저장·push 대상으로 반환한다")
    void incompleteProfile_targetsSelf() {
        var repo = mock(ProfileRepository.class);
        when(repo.existsByMemberId(MEMBER)).thenReturn(false);

        var resolved = new ProfileCompletionTargetResolver(repo)
                .resolve(new MemberFirstDeviceRegisteredEvent(MEMBER));

        assertThat(resolved.targets().persistReceiverIds()).containsExactly(MEMBER);
        assertThat(resolved.targets().pushReceiverIds()).containsExactly(MEMBER);
    }

    @Test
    @DisplayName("프로필이 이미 있으면(완성) 대상이 없어 발송하지 않는다")
    void completeProfile_noTargets() {
        var repo = mock(ProfileRepository.class);
        when(repo.existsByMemberId(MEMBER)).thenReturn(true);

        var resolved = new ProfileCompletionTargetResolver(repo)
                .resolve(new MemberFirstDeviceRegisteredEvent(MEMBER));

        assertThat(resolved.targets().persistReceiverIds()).isEmpty();
        assertThat(resolved.targets().pushReceiverIds()).isEmpty();
    }
}
