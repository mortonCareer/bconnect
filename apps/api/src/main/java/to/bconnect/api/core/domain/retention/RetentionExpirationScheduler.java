package to.bconnect.api.core.domain.retention;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.storage.otp.OtpRepository;
import to.bconnect.api.storage.retention.RetentionPolicy;
import to.bconnect.api.storage.retention.TransactionPartyRepository;
import to.bconnect.api.storage.session.SessionEntity;
import to.bconnect.api.storage.session.SessionRepository;
import to.bconnect.api.storage.signup.SignupTokenRepository;

import java.time.Instant;
import java.time.Period;

@Slf4j
@Component
@RequiredArgsConstructor
public class RetentionExpirationScheduler {

    private final TransactionPartyRepository transactionPartyRepository;
    private final SessionRepository sessionRepository;
    private final OtpRepository otpRepository;
    private final SignupTokenRepository signupTokenRepository;
    private final ApiConfigProps apiConfigProps;

    @Transactional
    @Scheduled(cron = "0 0 3 * * *", zone = "${app.timezone}")
    public void run() {
        val now = Instant.now();
        val retention = SessionEntity.class.getAnnotation(RetentionPolicy.class);
        val sessionThreshold = now.atZone(apiConfigProps.zoneId())
                .minus(Period.parse(retention.value()))
                .toInstant();
        val session = sessionRepository.deleteExpired(sessionThreshold);
        val transactionParty = transactionPartyRepository.deleteExpired(now);
        val otpCode = otpRepository.clearExpiredCodes(now);
        val startOfToday = now.atZone(apiConfigProps.zoneId())
                .toLocalDate()
                .atStartOfDay(apiConfigProps.zoneId())
                .toInstant();
        val otp = otpRepository.deleteBefore(startOfToday);
        val signupToken = signupTokenRepository.deleteExpired(now);
        log.info(
                "보관 만료 파기 완료: session={}, transactionParty={}, otpCode={}, otp={}, signupToken={}",
                session, transactionParty, otpCode, otp, signupToken
        );
    }
}
