package to.bconnect.api.core.domain.offer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class OfferExpirationScheduler {

    private final OfferService offerService;
    private final OfferRepository offerRepository;
    private final ApiConfigProps apiConfigProps;

    @Scheduled(cron = "0 0 0 * * *", zone = "${app.timezone}")
    public void run() {
        val offerIds = offerRepository.findAllByStatusAndDueBefore(OfferStatus.ACTIVE, LocalDate.now(apiConfigProps.zoneId())).stream()
                .map(OfferEntity::getId)
                .toList();

        int expired = 0;
        int failed = 0;
        for (val offerId : offerIds) {
            try {
                offerService.expire(offerId);
                expired++;
            } catch (Exception e) {
                failed++;
                log.warn("offer 만료 실패: offerId={}", offerId, e);
            }
        }

        log.info("offer 만료 완료: 대상={}, 처리={}, 실패={}", offerIds.size(), expired, failed);
    }
}
