package to.bconnect.api.core.domain.member;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum MemberExceptionCode implements ExceptionCode {
    DUPLICATE_USERNAME ("M001", HttpStatus.CONFLICT, "이미 사용 중인 사용자명입니다.", LogLevel.INFO),
    DUPLICATE_PHONE ("M002", HttpStatus.CONFLICT, "이미 사용 중인 전화번호입니다.", LogLevel.INFO),
    WITHDRAW_COMPANY_EXISTS ("M003", HttpStatus.CONFLICT, "소유한 업체가 있어 탈퇴할 수 없습니다. 업체를 먼저 삭제해주세요.", LogLevel.INFO),
    UNDERAGE ("M004", HttpStatus.CONFLICT, "만 15세 미만은 가입할 수 없습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
