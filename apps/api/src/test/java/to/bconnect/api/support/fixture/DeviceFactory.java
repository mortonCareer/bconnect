package to.bconnect.api.support.fixture;

import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;

public class DeviceFactory {

    public static DeviceTokenEntity entity(Long memberId, DevicePlatform platform) {
        return new DeviceTokenEntity(
                memberId,
                "token-" + memberId + "-" + platform.name(),
                platform,
                "arn:aws:sns:ap-northeast-2:000000000000:endpoint/GCM/bconnect/" + memberId
        );
    }
}
