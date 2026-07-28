package to.bconnect.api.oneclick.infrastructure.kcomwel;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;

import java.util.List;

// 근로복지공단 고용·산재보험 API 응답 (data.go.kr 봉투의 페이징 필드 등은 무시)
@JsonIgnoreProperties(ignoreUnknown = true)
public class KcomwelResponse {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(
            Header header,
            Body body
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Header(
            String resultCode,   // 결과코드 (resultCode)
            String resultMsg     // 결과메시지 (resultMsg)
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Body(
            Items items
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Items(
            @JacksonXmlElementWrapper(useWrapping = false)
            @JacksonXmlProperty(localName = "item")
            List<Item> item
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            String saeopjangNm,      // 사업장명 (saeopjangNm)
            String addr,             // 사업장 주소 (addr)
            String post,             // 우편번호 (post)
            String saeopjaDrno,      // 사업자등록번호 (saeopjaDrno)
            String sangsiInwonCnt,   // 상시근로자수 (sangsiInwonCnt)
            String seongripDt,       // 보험 성립일자 (seongripDt)
            String opaBoheomFg,      // 산재/고용 구분 (opaBoheomFg)
            String saeopFg,          // 보험가입구분 (saeopFg)
            String sjEopjongCd,      // 산재보험 업종코드 (sjEopjongCd)
            String sjEopjongNm,      // 산재보험 업종명 (sjEopjongNm)
            String gyEopjongCd,      // 고용보험 업종코드 (gyEopjongCd)
            String gyEopjongNm       // 고용보험 업종명 (gyEopjongNm)
    ) {}
}
