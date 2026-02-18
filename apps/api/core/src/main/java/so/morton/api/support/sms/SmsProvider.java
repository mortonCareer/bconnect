package so.morton.api.support.sms;

public interface SmsProvider {
    void send(String phone, String message);
}
