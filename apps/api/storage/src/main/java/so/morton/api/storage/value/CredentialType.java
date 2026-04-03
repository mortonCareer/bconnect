package so.morton.api.storage.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CredentialType {

    // 사업자 및 면허
    IDENTITY_VERIFICATION("본인인증"),
    SOLE_PROPRIETOR("개인사업자"),
    CONSTRUCTION_LICENSE("건설업면허"),
    SPECIALTY_CONSTRUCTION_LICENSE("전문건설업면허"),

    // 증명서
    CAREER_CERTIFICATE("경력증명서"),
    SKILL_GRADE_CERTIFICATE("기능등급증명서"),
    OTHER_CERTIFICATE("기타 증명서"),

    // 자격증
    NATIONAL_TECHNICAL_QUALIFICATION("국가기술자격"),
    SKILLED_TECHNICIAN("숙련기술인"),
    OTHER_QUALIFICATION("기타 자격증");

    private final String label;
}
