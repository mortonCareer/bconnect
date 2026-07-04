package to.bconnect.api.sms;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import to.bconnect.api.security.otp.OtpIssuedEvent;
import to.bconnect.api.security.session.NewDeviceLoginEvent;

@Component
@RequiredArgsConstructor
public class SmsEventListener {

    private final SmsProvider smsProvider;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOtpIssuedEvent(OtpIssuedEvent event) {
        smsProvider.send(event.phone(), String.format(SmsTemplate.OTP_CODE, event.code()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNewDeviceLoginEvent(NewDeviceLoginEvent event) {
        smsProvider.send(event.phone(), SmsTemplate.NEW_DEVICE_LOGIN);
    }
}
