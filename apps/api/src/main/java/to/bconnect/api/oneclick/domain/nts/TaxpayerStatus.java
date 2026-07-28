package to.bconnect.api.oneclick.domain.nts;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
// 납세자 상태
public enum TaxpayerStatus {
    CONTINUING("01"),
    SUSPENDED("02"),
    CLOSED("03"),
    UNKNOWN(null);

    private final String code;

    public static TaxpayerStatus of(String code) {
        return Arrays.stream(values())
                .filter(it -> it.code != null && it.code.equals(code))
                .findFirst()
                .orElse(UNKNOWN);
    }
}
