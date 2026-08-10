package to.bconnect.api.oneclick.domain;

import java.time.LocalDate;

// 원클릭 조회 커맨드
public record LookupOneClick(
        String brn,
        String ownerName,
        LocalDate openedAt
) {
}
