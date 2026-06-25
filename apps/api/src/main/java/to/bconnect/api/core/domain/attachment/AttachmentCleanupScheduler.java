package to.bconnect.api.core.domain.attachment;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AttachmentCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(AttachmentCleanupScheduler.class);

    private final AttachmentCleanupService attachmentCleanupService;

    @Scheduled(cron = "0 0 6 * * WED", zone = "Asia/Seoul")
    public void run() {
        val result = attachmentCleanupService.cleanup();
        log.info("attachment cleanup 완료: {}", result);
    }
}
