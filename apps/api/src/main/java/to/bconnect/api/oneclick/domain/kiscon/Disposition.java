package to.bconnect.api.oneclick.domain.kiscon;

// 행정처분
public record Disposition(
        String tradeName
) {
    public ConstructionBusinessType type() {
        return ConstructionBusinessType.of(tradeName);
    }
}
