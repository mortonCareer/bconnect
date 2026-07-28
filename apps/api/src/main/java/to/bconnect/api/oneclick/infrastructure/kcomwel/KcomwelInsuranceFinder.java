package to.bconnect.api.oneclick.infrastructure.kcomwel;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import to.bconnect.api.oneclick.domain.kcomwel.Insurance;

import java.util.List;

// 고용·산재보험 조회 (근로복지공단)
@Component
public class KcomwelInsuranceFinder {

    private static final String SUCCESS = "00";
    private static final XmlMapper XML = new XmlMapper();

    private final RestClient kcomwelRestClient;
    private final KcomwelProperties properties;

    public KcomwelInsuranceFinder(RestClient kcomwelRestClient, KcomwelProperties properties) {
        this.kcomwelRestClient = kcomwelRestClient;
        this.properties = properties;
    }

    public Insurance resolve(String brn) {
        val xml = kcomwelRestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/getGySjBoheomBsshItem")
                        .queryParam("serviceKey", properties.serviceKey())
                        .queryParam("v_saeopjaDrno", brn)
                        .queryParam("numOfRows", 10)
                        .queryParam("pageNo", 1)
                        .build())
                .retrieve()
                .body(byte[].class);

        val response = parse(xml);
        if (response == null || response.header() == null || !SUCCESS.equals(response.header().resultCode()))
            return Insurance.empty();

        val items = items(response);
        if (items.isEmpty())
            return Insurance.empty();

        val item = items.getFirst();
        val industry = item.sjEopjongNm() != null ? item.sjEopjongNm() : item.gyEopjongNm();
        return new Insurance(
                item.saeopjangNm(),
                item.addr(),
                industry,
                item.sangsiInwonCnt(),
                item.seongripDt()
        );
    }

    private static KcomwelResponse.Response parse(byte[] xml) {
        if (xml == null || xml.length == 0)
            return null;
        try {
            // 바이트로 파싱 — data.go.kr 응답에 charset 미표기(ISO-8859-1 기본) 시 한글 깨짐 방지, XML prolog(UTF-8) 준수
            return XML.readValue(xml, KcomwelResponse.Response.class);
        } catch (Exception e) {
            throw new IllegalStateException("kcomwel xml parse failed", e);
        }
    }

    private static List<KcomwelResponse.Item> items(KcomwelResponse.Response response) {
        if (response.body() == null || response.body().items() == null || response.body().items().item() == null)
            return List.of();
        return response.body().items().item();
    }
}
