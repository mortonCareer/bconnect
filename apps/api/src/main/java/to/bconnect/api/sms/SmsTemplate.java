package to.bconnect.api.sms;

public class SmsTemplate {

    private static final String PREFIX = "[품앗이]";

    public static final String OTP_CODE = PREFIX + " 인증번호 [%s]를 입력해 주세요.";
    public static final String NEW_DEVICE_LOGIN = PREFIX + " 새로운 기기에서 로그인되었어요. 본인이 아니라면 고객센터로 문의해 주세요.";

    private SmsTemplate() {}
}
