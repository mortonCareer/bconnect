package to.bconnect.api.oneclick.infrastructure.nts;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import to.bconnect.api.oneclick.domain.nts.BusinessValidation;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

// 사업자 진위확인 (국세청)
@Component
@RequiredArgsConstructor
public class BusinessValidator {

    private static final String VALID = "01";
    private static final DateTimeFormatter OPENED_AT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final RestClient ntsRestClient;
    private final NtsProperties properties;

    public BusinessValidation check(String brn, String ownerName, LocalDate openedAt) {
        val body = Map.of("businesses", List.of(Map.of(
                "b_no", brn,
                "start_dt", openedAt.format(OPENED_AT),
                "p_nm", ownerName
        )));

        val response = ntsRestClient.post()
                .uri(uriBuilder -> uriBuilder.path("/validate")
                        .queryParam("serviceKey", properties.serviceKey())
                        .build())
                .body(body)
                .retrieve()
                .body(NtsResponse.Validate.class);

        if (response == null || response.data() == null || response.data().isEmpty())
            return new BusinessValidation(false, null);

        val item = response.data().getFirst();
        return new BusinessValidation(VALID.equals(item.valid()), item.validMsg());
    }
}
