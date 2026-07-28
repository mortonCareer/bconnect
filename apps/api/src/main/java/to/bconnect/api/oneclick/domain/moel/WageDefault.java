package to.bconnect.api.oneclick.domain.moel;

// 체불사업주
public record WageDefault(
        String name,            // 성명 (성명)
        String companyName,     // 사업장명 (사업장명)
        String industry,        // 업종 (업종)
        String arrearsAmount,   // 체불액 (체불액)
        String companyAddress   // 소재지 (소재지)
) {
}
