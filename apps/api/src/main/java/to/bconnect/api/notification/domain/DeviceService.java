package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    public List<DeviceTokenEntity> pushableDevices(Long memberId) {
        return deviceTokenRepository.findByMemberIdAndEnabledTrue(memberId);
    }

    @Transactional
    public void register(AuthUser user, String token, DevicePlatform platform) {
        String endpointArn = pushEndpointRegistry.ensureEndpoint(token);

        deviceTokenRepository.findByToken(token).ifPresentOrElse(
                existing -> existing.refresh(user.id(), endpointArn),
                () -> deviceTokenRepository.save(
                        new DeviceTokenEntity(user.id(), token, platform, endpointArn))
        );
    }

    @Transactional
    public void unregister(AuthUser user, String token) {
        deviceTokenRepository.findByMemberIdAndToken(user.id(), token).ifPresent(entity -> {
            try {
                pushEndpointRegistry.deleteEndpoint(entity.getSnsEndpointArn());
            } catch (Exception e) {
                log.warn("SNS endpoint 삭제 실패 — DB row 는 제거 진행. reason={}", e.getMessage());
            }
            deviceTokenRepository.delete(entity);
        });
    }
}
