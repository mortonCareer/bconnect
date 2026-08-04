package to.bconnect.api.oneclick.domain.kcomwel;

import to.bconnect.api.oneclick.domain.Verdict;

import java.time.LocalDate;

// 고용·산재보험 결과
public record InsuranceResult(
        Verdict verdict,
        String companyName,       // 사업장명 (saeopjangNm)
        String industry,          // 산재보험 업종명 또는 고용보험 업종명 (sjEopjongNm|gyEopjongNm)
        String workerCount,       // 상시근로자수 (sangsiInwonCnt)
        LocalDate establishedAt   // 보험 성립일자 (seongripDt)
) {
    public static InsuranceResult of(Insurance insurance) {
        return new InsuranceResult(
                insurance.present() ? Verdict.CONFIRMED : Verdict.UNKNOWN,
                insurance.saeopjangNm(),
                insurance.sjEopjongNm() != null ? insurance.sjEopjongNm() : insurance.gyEopjongNm(),
                insurance.sangsiInwonCnt(),
                insurance.seongripDt()
        );
    }

    public static InsuranceResult error() {
        return new InsuranceResult(Verdict.ERROR, null, null, null, null);
    }
}
