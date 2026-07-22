package to.bconnect.api.notification.domain.target;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.MemberFirstDeviceRegisteredEvent;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.storage.profile.ProfileRepository;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class ProfileCompletionTargetResolver implements NotificationTargetResolver<MemberFirstDeviceRegisteredEvent> {

    private final ProfileRepository profileRepository;

    @Override
    public NotificationType supports() {
        return NotificationType.PROFILE_COMPLETION;
    }

    @Override
    public ResolvedNotification resolve(MemberFirstDeviceRegisteredEvent event) {
        // 프로필이 이미 있으면(완성) 대상 없음 → 발송 안 함
        if (profileRepository.existsByMemberId(event.memberId())) {
            return new ResolvedNotification(null, null, null, new ResolvedNotification.Targets(Set.of(), Set.of()));
        }
        Set<Long> self = Set.of(event.memberId());
        return new ResolvedNotification(null, null, null, new ResolvedNotification.Targets(self, self));
    }
}
