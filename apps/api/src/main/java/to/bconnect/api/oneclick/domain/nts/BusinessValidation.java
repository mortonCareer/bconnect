package to.bconnect.api.oneclick.domain.nts;

// 진위확인 결과
public record BusinessValidation(
        boolean valid,
        String message
) {
}
