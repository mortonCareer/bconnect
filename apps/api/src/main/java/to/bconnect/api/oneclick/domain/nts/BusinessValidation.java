package to.bconnect.api.oneclick.domain.nts;

// 진위확인 결과
public record BusinessValidation(
        boolean valid,      // 진위 판정 (valid)
        String validMsg     // 판정 메시지 (valid_msg)
) {
}
