package to.bconnect.api.oneclick.domain.kcomwel;

// 고용·산재보험
public record Insurance(
        String companyName,    // 사업장명 (saeopjangNm)
        String address,        // 소재지 (addr)
        String industry,       // 업종 (sjEopjongNm|gyEopjongNm)
        String workerCount,    // 상시근로자수 (sangsiInwonCnt)
        String establishedAt   // 성립일자 (seongripDt)
) {
    public static Insurance empty() {
        return new Insurance(null, null, null, null, null);
    }

    public boolean present() {
        return companyName != null;
    }
}
