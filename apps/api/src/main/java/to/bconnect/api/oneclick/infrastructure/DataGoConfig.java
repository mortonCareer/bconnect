package to.bconnect.api.oneclick.infrastructure;

import lombok.val;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class DataGoConfig {

    private static final String NTS_BASE_URL = "https://api.odcloud.kr/api/nts-businessman/v1";
    private static final String KCOMWEL_BASE_URL = "https://apis.data.go.kr/B490001/gySjbPstateInfoService";
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    @Bean
    public RestClient ntsRestClient() {
        val factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT);
        factory.setReadTimeout(READ_TIMEOUT);

        return RestClient.builder()
                .baseUrl(NTS_BASE_URL)
                .requestFactory(factory)
                .build();
    }

    @Bean
    public RestClient kcomwelRestClient() {
        val factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT);
        factory.setReadTimeout(READ_TIMEOUT);

        return RestClient.builder()
                .baseUrl(KCOMWEL_BASE_URL)
                .requestFactory(factory)
                .build();
    }
}
