package to.bconnect.api.oneclick.infrastructure;

import lombok.val;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
// 공공데이터포털 RestClient 설정. 국세청 · 근로복지공단 공용
public class DataGoConfig {

    private static final String NTS_BASE_URL = "https://api.odcloud.kr/api/nts-businessman/v1";
    private static final String KCOMWEL_BASE_URL = "https://apis.data.go.kr/B490001/gySjbPstateInfoService";
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    @Bean
    public RestClient ntsRestClient() {
        return restClient(NTS_BASE_URL);
    }

    @Bean
    public RestClient kcomwelRestClient() {
        return restClient(KCOMWEL_BASE_URL);
    }

    private static RestClient restClient(String baseUrl) {
        val factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT);
        factory.setReadTimeout(READ_TIMEOUT);

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }
}
