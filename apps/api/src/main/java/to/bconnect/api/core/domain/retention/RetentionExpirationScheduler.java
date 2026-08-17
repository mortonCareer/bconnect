package to.bconnect.api.core.domain.retention;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.retention.AbuseRecordRepository;
import to.bconnect.api.storage.retention.TransactionPartyRepository;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class RetentionExpirationScheduler {

    private final AbuseRecordRepository abuseRecordRepository;
    private final TransactionPartyRepository transactionPartyRepository;

    @Transactional
    @Scheduled(cron = "0 0 3 * * *", zone = "${app.timezone}")
    public void run() {
        val now = Instant.now();
        val abuse = abuseRecordRepository.deleteByExpireAtBefore(now);
        val transactionParty = transactionPartyRepository.deleteByExpireAtBefore(now);

        log.info("보관 만료 파기 완료: abuse={}, transactionParty={}", abuse, transactionParty);
    }
}
