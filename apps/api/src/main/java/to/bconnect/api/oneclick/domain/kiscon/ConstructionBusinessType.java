package to.bconnect.api.oneclick.domain.kiscon;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.val;

import java.util.Arrays;
import java.util.Set;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
// 종합·전문 건설업 구분
public enum ConstructionBusinessType {
    GENERAL(Set.of(
            "토목공사업",
            "건축공사업",
            "토목건축공사업",
            "산업환경설비공사업",
            "조경공사업"
    )),
    SPECIALTY(Set.of(
            "지반조성포장공사업",
            "실내건축공사업",
            "금속창호지붕건축물조립공사업",
            "도장습식방수석공사업",
            "조경식재시설물공사업",
            "철근콘크리트공사업",
            "구조물해체비계공사업",
            "상하수도설비공사업",
            "철도궤도공사업",
            "철강구조물공사업",
            "수중준설공사업",
            "승강기삭도공사업",
            "기계설비가스공사업",
            "가스난방공사업"
    )),
    UNKNOWN(Set.of());

    private static final String DELIMITER = "[^가-힣A-Za-z0-9]";

    private final Set<String> tradeNames;

    public static ConstructionBusinessType of(String tradeName) {
        if (tradeName == null)
            return UNKNOWN;

        val normalized = tradeName.replaceAll(DELIMITER, "");
        return Arrays.stream(values())
                .filter(it -> it.tradeNames.contains(normalized))
                .findFirst()
                .orElse(UNKNOWN);
    }
}
