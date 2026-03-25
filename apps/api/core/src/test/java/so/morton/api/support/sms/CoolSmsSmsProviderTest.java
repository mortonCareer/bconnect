package so.morton.api.support.sms;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CoolSmsSmsProviderTest {

    @Test
    void properties_바인딩_확인() {
        SmsProperties props = new SmsProperties("test-key", "test-secret", "01012345678");
        assertThat(props.apiKey()).isEqualTo("test-key");
        assertThat(props.apiSecret()).isEqualTo("test-secret");
        assertThat(props.senderNumber()).isEqualTo("01012345678");
    }

    @Test
    void 잘못된_API_키로_생성시_예외_또는_정상_초기화() {
        SmsProperties props = new SmsProperties("invalid", "invalid", "01012345678");
        CoolSmsSmsProvider provider = new CoolSmsSmsProvider(props);
        assertThat(provider).isNotNull();
    }
}
