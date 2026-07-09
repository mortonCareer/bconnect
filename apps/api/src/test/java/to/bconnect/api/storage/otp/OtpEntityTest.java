package to.bconnect.api.storage.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.support.fixture.OtpFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE_TIME;

class OtpEntityTest {

    @Test
    @DisplayName("코드 재발급 시 시도 횟수가 초기화된다")
    void generateCodeResetsAttempts() {
        OtpEntity otp = OtpFactory.createEntity("01012345678", 5);

        otp.generateCode("111111", MAX_DATE_TIME);

        assertThat(otp.getAttempts()).isZero();
    }
}
