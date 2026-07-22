package to.bconnect.api.attachment.domain.cleanup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AttachmentCleanupScheduler {

    private final AttachmentCleanupService attachmentCleanupService;

    @Scheduled(cron = "0 0 6 * * WED", zone = "${app.timezone}")
    public void run() {
        val result = attachmentCleanupService.cleanup();
        log.info("attachment cleanup 완료: {}", result);
    }
}
