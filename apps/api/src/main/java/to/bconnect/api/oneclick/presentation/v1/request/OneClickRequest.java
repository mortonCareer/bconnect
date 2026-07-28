package to.bconnect.api.oneclick.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import to.bconnect.api.common.Regex;
import to.bconnect.api.oneclick.domain.LookupOneClick;

import java.time.LocalDate;

// 원클릭 조회 요청
public record OneClickRequest(
        @NotBlank @Pattern(regexp = Regex.BRN) String brn,
        @NotBlank String ownerName,
        @NotNull @PastOrPresent LocalDate openedAt
) {
    public LookupOneClick toCommand() {
        return new LookupOneClick(brn, ownerName, openedAt);
    }
}
