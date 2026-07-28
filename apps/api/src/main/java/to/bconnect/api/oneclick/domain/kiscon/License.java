package to.bconnect.api.oneclick.domain.kiscon;

import java.time.LocalDate;

// 건설업 면허
public record License(
        String tradeName,
        LocalDate registeredAt
) {
    public ConstructionBusinessType type() {
        return ConstructionBusinessType.of(tradeName);
    }
}
