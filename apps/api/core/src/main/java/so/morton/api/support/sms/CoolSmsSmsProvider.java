package so.morton.api.support.sms;

import lombok.extern.slf4j.Slf4j;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile({"prod", "dev"})
public class CoolSmsSmsProvider implements SmsProvider {

    private static final String API_URL = "https://api.coolsms.co.kr";

    private final DefaultMessageService messageService;
    private final String senderNumber;

    public CoolSmsSmsProvider(SmsProperties properties) {
        this.messageService = NurigoApp.INSTANCE
                .initialize(properties.apiKey(), properties.apiSecret(), API_URL);
        this.senderNumber = properties.senderNumber();
    }

    @Override
    public void send(String phone, String message) {
        Message sms = new Message();
        sms.setFrom(senderNumber);
        sms.setTo(phone);
        sms.setText(message);

        try {
            messageService.sendOne(new SingleMessageSendingRequest(sms));
            log.info("SMS sent to {}", phone);
        } catch (Exception e) {
            log.warn("SMS send failed, retrying: {}", e.getMessage());
            retrySend(sms, e);
        }
    }

    private void retrySend(Message sms, Exception original) {
        try {
            messageService.sendOne(new SingleMessageSendingRequest(sms));
            log.info("SMS retry succeeded to {}", sms.getTo());
        } catch (Exception e) {
            log.error("SMS retry also failed to {}: {}", sms.getTo(), e.getMessage());
            throw new RuntimeException("SMS 발송 실패: " + sms.getTo(), e);
        }
    }
}
