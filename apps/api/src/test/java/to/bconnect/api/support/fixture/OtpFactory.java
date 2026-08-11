package to.bconnect.api.support.fixture;

import lombok.val;
import to.bconnect.api.security.otp.Otp;
import to.bconnect.api.security.otp.OtpIssuedEvent;
import to.bconnect.api.storage.otp.OtpEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE_TIME;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class OtpFactory {

    public static final String DEFAULT_CODE = "000000";

    public static Otp domain(Long id, String phone) {
        return new Otp(id, phone, DEFAULT_CODE, MAX_DATE_TIME, 0, false, 1,
                MIN_DATE_TIME, MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static OtpEntity entity(String phone) {
        return new OtpEntity(phone, DEFAULT_CODE, MAX_DATE_TIME);
    }

    public static OtpEntity entity(String phone, String code) {
        return new OtpEntity(phone, code, MAX_DATE_TIME);
    }

    public static OtpEntity entity(String phone, int count) {
        val entity = entity(phone);
        for (int i = 0; i < count; i++) entity.attempt();
        return entity;
    }

    public static OtpIssuedEvent issuedEvent(String phone) {
        return new OtpIssuedEvent(phone, DEFAULT_CODE);
    }
}
