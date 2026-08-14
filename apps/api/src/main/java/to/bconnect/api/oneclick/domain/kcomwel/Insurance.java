package to.bconnect.api.oneclick.domain.kcomwel;

import java.time.LocalDate;

// 고용·산재보험
public record Insurance(
        String saeopjangNm,      // 사업장명 (saeopjangNm)
        String addr,             // 사업장 주소 (addr)
        String post,             // 우편번호 (post)
        String saeopjaDrno,      // 사업자등록번호 (saeopjaDrno)
        String sangsiInwonCnt,   // 상시근로자수 (sangsiInwonCnt)
        LocalDate seongripDt,    // 보험 성립일자 (seongripDt)
        String opaBoheomFg,      // 산재/고용 구분 (opaBoheomFg)
        String saeopFg,          // 보험가입구분 (saeopFg)
        String sjEopjongCd,      // 산재보험 업종코드 (sjEopjongCd)
        String sjEopjongNm,      // 산재보험 업종명 (sjEopjongNm)
        String gyEopjongCd,      // 고용보험 업종코드 (gyEopjongCd)
        String gyEopjongNm       // 고용보험 업종명 (gyEopjongNm)
) {
    public static Insurance empty() {
        return new Insurance(null, null, null, null, null, null, null, null, null, null, null, null);
    }

    public boolean present() {
        return saeopjangNm != null;
    }
}
