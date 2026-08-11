package to.bconnect.api.oneclick.domain;

import java.time.LocalDate;

// 사업자 진위확인 커맨드
public record ValidateBusiness(
        String brn,
        String ownerName,
        LocalDate openedAt
) {
}
