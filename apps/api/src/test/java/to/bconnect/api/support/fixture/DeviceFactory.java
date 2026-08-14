package to.bconnect.api.support.fixture;

import lombok.val;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;

import java.util.UUID;

public class DeviceFactory {

    public static DeviceTokenEntity entity(Long memberId, DevicePlatform platform) {
        val uuid = UUID.randomUUID().toString();
        return new DeviceTokenEntity(
                memberId,
                "token-" + uuid,
                platform,
                "arn:aws:sns:ap-northeast-2:000000000000:endpoint/GCM/bconnect/" + uuid
        );
    }
}
