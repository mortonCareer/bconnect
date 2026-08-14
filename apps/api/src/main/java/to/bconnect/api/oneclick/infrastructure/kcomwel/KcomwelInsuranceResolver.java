package to.bconnect.api.oneclick.infrastructure.kcomwel;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.kcomwel.Insurance;
import to.bconnect.api.oneclick.infrastructure.DataGoProperties;

import java.util.List;

// 고용·산재보험 조회 (근로복지공단)
@Component
@RequiredArgsConstructor
public class KcomwelInsuranceResolver {

    private static final String SUCCESS = "00";
    private static final XmlMapper XML = new XmlMapper();

    private final RestClient kcomwelRestClient;
    private final DataGoProperties properties;

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
        return new Insurance(
                item.saeopjangNm(),
                item.addr(),
                item.post(),
                item.saeopjaDrno(),
                item.sangsiInwonCnt(),
                OneClickUtils.parseDate(item.seongripDt()),
                item.opaBoheomFg(),
                item.saeopFg(),
                item.sjEopjongCd(),
                item.sjEopjongNm(),
                item.gyEopjongCd(),
                item.gyEopjongNm()
        );
    }

    private static KcomwelResponse.Response parse(byte[] xml) {
        if (xml == null || xml.length == 0)
            return null;
        try {
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
