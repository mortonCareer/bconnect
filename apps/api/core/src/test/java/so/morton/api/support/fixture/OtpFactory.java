package so.morton.api.support.fixture;

import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.api.controller.v1.request.SendCodeRequest;
import so.morton.api.storage.domain.otp.OtpEntity;

import java.time.LocalDateTime;

public class OtpFactory {

    public static final String DEFAULT_CODE = "000000";

    public static OtpEntity createEntity(String phone) {
        return new OtpEntity(phone, DEFAULT_CODE, LocalDateTime.MAX);
    }

    public static OtpEntity createEntity(String phone, String code) {
        return new OtpEntity(phone, code, LocalDateTime.MAX);
    }

    public static OtpEntity createExpiredEntity(String phone) {
        return new OtpEntity(phone, DEFAULT_CODE, LocalDateTime.MIN);
    }

    public static OtpEntity createEntity(String phone, int count) {
        OtpEntity entity = createEntity(phone);
        ReflectionTestUtils.setField(entity, "attemptCount", count);
        return entity;
    }

    public static OtpEntity createEntity(String phone, int count, LocalDateTime modifiedAt) {
        OtpEntity entity = createEntity(phone);
        ReflectionTestUtils.setField(entity, "dailyCount", count);
        ReflectionTestUtils.setField(entity, "modifiedAt", modifiedAt);
        return entity;
    }

    public static SendCodeRequest sendCodeRequest() {
        return new SendCodeRequest("01000000000");
    }
}
