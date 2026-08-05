package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.notification.domain.push.PushEndpointRegistry;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;
import to.bconnect.api.storage.device.DeviceTokenRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final PushEndpointRegistry pushEndpointRegistry;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<DeviceTokenEntity> list(Long memberId) {
        return deviceTokenRepository.findByMemberIdAndEnabledTrue(memberId);
    }

    @Transactional
    public void register(AuthUser user, String token, DevicePlatform platform) {
        val endpoint = pushEndpointRegistry.ensure(token);
        val optional = deviceTokenRepository.findByToken(token);

        if (optional.isPresent()) {
            val found = optional.get();
            found.refresh(user.id(), endpoint);
        } else {
            val created = new DeviceTokenEntity(user.id(), token, platform, endpoint);
            deviceTokenRepository.save(created);
            eventPublisher.publishEvent(new DeviceRegisteredEvent(user.id()));
        }
    }

    @Transactional
    public void unregister(AuthUser user, String token) {
        val optional = deviceTokenRepository.findByMemberIdAndToken(user.id(), token);

        if(optional.isPresent()) {
            val found = optional.get();
            try {
                pushEndpointRegistry.delete(found.getEndpoint());
            } catch (Exception e) {
                log.warn("SNS endpoint 삭제 실패(DB row 는 제거 진행): memberId={}", user.id(), e);
            }
            deviceTokenRepository.delete(found);
        }
    }
}
