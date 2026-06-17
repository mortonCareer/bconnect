package to.bconnect.api.support.sms;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile({"prod", "dev"})
public class SolapiSmsProvider implements SmsProvider {

    private static final String API_URL = "https://api.solapi.com";

    private final DefaultMessageService messageService;
    private final String senderNumber;

    public SolapiSmsProvider(SmsProperties properties) {
        this.messageService = NurigoApp.INSTANCE
                .initialize(properties.apiKey(), properties.apiSecret(), API_URL);
        this.senderNumber = properties.senderNumber();
    }

    @Override
    public void send(String phone, String message) {
        val sms = new Message();
        sms.setFrom(senderNumber);
        sms.setTo(phone);
        sms.setText(message);

        try {
            messageService.sendOne(new SingleMessageSendingRequest(sms));
            log.info("SMS sent to {}", maskPhone(phone));
        } catch (Exception e) {
            log.warn("SMS send failed, retrying: {}", e.getMessage());
            retrySend(sms, e);
        }
    }

    private void retrySend(Message sms, Exception original) {
        try {
            messageService.sendOne(new SingleMessageSendingRequest(sms));
            log.info("SMS retry succeeded to {}", maskPhone(sms.getTo()));
        } catch (Exception e) {
            log.error("SMS retry also failed to {}: {}", maskPhone(sms.getTo()), e.getMessage());
            e.addSuppressed(original);
            throw new RuntimeException("SMS 발송 실패: " + maskPhone(sms.getTo()), e);
        }
    }

    private static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return "***";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}
