package so.morton.api.storage.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.Duration;

@Getter
@RequiredArgsConstructor
public enum CredentialType {
    // TODO: 만료기한 설정

    // 사업자 및 면허
    IDENTITY_VERIFICATION(null),
    SOLE_PROPRIETOR(Duration.ofDays(365)),
    CONSTRUCTION_LICENSE(Duration.ofDays(365)),
    SPECIALTY_CONSTRUCTION_LICENSE(Duration.ofDays(365)),
    // 증명서
    CAREER_CERTIFICATE(null),
    SKILL_GRADE_CERTIFICATE(Duration.ofDays(365)),
    OTHER_CERTIFICATE(null),
    // 자격증
    NATIONAL_TECHNICAL_QUALIFICATION(Duration.ofDays(365)),
    SKILLED_TECHNICIAN(Duration.ofDays(365)),
    OTHER_QUALIFICATION(null);

    private final Duration expiration;
}