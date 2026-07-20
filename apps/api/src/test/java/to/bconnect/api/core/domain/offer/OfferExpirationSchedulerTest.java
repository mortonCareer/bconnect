package to.bconnect.api.core.domain.offer;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OfferExpirationSchedulerTest {

    @Mock private OfferService offerService;
    @Mock private OfferRepository offerRepository;
    @Mock private ApiConfigProps apiConfigProps;

    @InjectMocks private OfferExpirationScheduler scheduler;

    @Test
    @DisplayName("만료 대상마다 expire 를 호출하고 한 건 실패해도 나머지를 처리한다")
    void run_expiresEachAndContinuesOnFailure() {
        var first = mock(OfferEntity.class);
        when(first.getId()).thenReturn(1L);
        var second = mock(OfferEntity.class);
        when(second.getId()).thenReturn(2L);
        when(apiConfigProps.zoneId()).thenReturn(ZoneId.of("Asia/Seoul"));
        when(offerRepository.findAllByStatusAndDueBefore(eq(OfferStatus.ACTIVE), any()))
                .thenReturn(List.of(first, second));
        doThrow(new RuntimeException("boom")).when(offerService).expire(1L);

        scheduler.run();

        verify(offerService).expire(1L);
        verify(offerService).expire(2L);
    }
}
