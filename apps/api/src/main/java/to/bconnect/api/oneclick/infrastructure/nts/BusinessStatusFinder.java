package to.bconnect.api.oneclick.infrastructure.nts;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import to.bconnect.api.oneclick.infrastructure.DataGoProperties;
import to.bconnect.api.oneclick.domain.nts.BusinessStatus;
import to.bconnect.api.oneclick.domain.nts.TaxpayerStatus;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

// 사업자 상태조회 (국세청)
@Component
@RequiredArgsConstructor
public class BusinessStatusFinder {

    private static final DateTimeFormatter CLOSED_AT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final RestClient ntsRestClient;
    private final DataGoProperties properties;

    public BusinessStatus resolve(String brn) {
        val response = ntsRestClient.post()
                .uri(uriBuilder -> uriBuilder.path("/status")
                        .queryParam("serviceKey", properties.serviceKey())
                        .build())
                .body(Map.of("b_no", List.of(brn)))
                .retrieve()
                .body(NtsResponse.Status.class);

        if (response == null || response.data() == null || response.data().isEmpty())
            return new BusinessStatus(TaxpayerStatus.UNKNOWN, null);

        val item = response.data().getFirst();
        return new BusinessStatus(TaxpayerStatus.of(item.bSttCd()), parseClosedAt(item.endDt()));
    }

    private static LocalDate parseClosedAt(String value) {
        if (value == null || value.isBlank())
            return null;
        return LocalDate.parse(value, CLOSED_AT);
    }
}
