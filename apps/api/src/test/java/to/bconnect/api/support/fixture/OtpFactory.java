package to.bconnect.api.support.fixture;

import lombok.val;
import to.bconnect.api.security.otp.SendCodeRequest;
import to.bconnect.api.storage.otp.OtpEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE_TIME;

public class OtpFactory {

    public static final String DEFAULT_CODE = "000000";

    public static OtpEntity createEntity(String phone) {
        return new OtpEntity(phone, DEFAULT_CODE, MAX_DATE_TIME);
    }

    public static OtpEntity createEntity(String phone, String code) {
        return new OtpEntity(phone, code, MAX_DATE_TIME);
    }

    public static OtpEntity createEntity(String phone, int count) {
        val entity = createEntity(phone);
        for (int i = 0; i < count; i++) entity.attempt();
        return entity;
    }

    public static SendCodeRequest sendCodeRequest() {
        return new SendCodeRequest("01000000000");
    }
}
