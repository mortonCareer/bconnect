package to.bconnect.api.sms.infrastructure;

import com.solapi.sdk.SolapiClient;
import com.solapi.sdk.message.exception.SolapiApiKeyException;
import com.solapi.sdk.message.exception.SolapiBadRequestException;
import com.solapi.sdk.message.exception.SolapiInvalidApiKeyException;
import com.solapi.sdk.message.model.Message;
import com.solapi.sdk.message.service.DefaultMessageService;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.sms.SmsProvider;

import static to.bconnect.api.common.CommonUtils.maskPhone;

/**
 * @see <a href="https://github.com/solapi/solapi-kotlin/blob/main/LLM_GUIDE.md">SOLAPI : LLM Guide</a>
 */
@Slf4j
@Component
@Profile({"prod", "dev"})
public class SolapiSmsProvider implements SmsProvider {

    private final DefaultMessageService messageService;
    private final String senderNumber;

    public SolapiSmsProvider(SmsProperties properties) {
        this.messageService = SolapiClient.INSTANCE
                .createInstance(properties.apiKey(), properties.apiSecret());
        this.senderNumber = properties.senderNumber();
    }

    @Override
    public void send(String phone, String message) {
        val sms = new Message();
        sms.setFrom(senderNumber);
        sms.setTo(phone);
        sms.setText(message);

        try {
            messageService.send(sms, null);
            log.info("SMS sent to {}", maskPhone(phone));
        } catch (Exception e) {
            if (isNonRetryable(e)) {
                log.error("SMS send rejected to {}: {}", maskPhone(phone), e.getMessage());
                throw new RuntimeException("SMS 발송 실패: " + maskPhone(phone), e);
            }
            log.warn("SMS send failed, retrying: {}", e.getMessage());
            retrySend(sms, e);
        }
    }

    private static boolean isNonRetryable(Exception e) {
        return e instanceof SolapiBadRequestException
                || e instanceof SolapiInvalidApiKeyException
                || e instanceof SolapiApiKeyException;
    }

    private void retrySend(Message sms, Exception original) {
        try {
            messageService.send(sms, null);
            log.info("SMS retry succeeded to {}", maskPhone(sms.getTo()));
        } catch (Exception e) {
            log.error("SMS retry also failed to {}: {}", maskPhone(sms.getTo()), e.getMessage());
            e.addSuppressed(original);
            throw new RuntimeException("SMS 발송 실패: " + maskPhone(sms.getTo()), e);
        }
    }
}
