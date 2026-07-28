package to.bconnect.api.oneclick.domain.kcomwel;

import to.bconnect.api.oneclick.domain.Verdict;

// 고용·산재보험 결과
public record InsuranceResult(
        Verdict verdict,
        String companyName,    // 사업장명 (saeopjangNm)
        String industry,       // 업종 (sjEopjongNm|gyEopjongNm)
        String workerCount,    // 상시근로자수 (sangsiInwonCnt)
        String establishedAt   // 성립일자 (seongripDt)
) {
    public static InsuranceResult of(Insurance insurance) {
        return new InsuranceResult(
                insurance.present() ? Verdict.CONFIRMED : Verdict.UNKNOWN,
                insurance.companyName(),
                insurance.industry(),
                insurance.workerCount(),
                insurance.establishedAt()
        );
    }

    public static InsuranceResult error() {
        return new InsuranceResult(Verdict.ERROR, null, null, null, null);
    }
}
