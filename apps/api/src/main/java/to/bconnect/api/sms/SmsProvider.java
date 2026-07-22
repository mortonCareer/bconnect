package to.bconnect.api.sms;

public interface SmsProvider {
    void send(String phone, String message);
}
