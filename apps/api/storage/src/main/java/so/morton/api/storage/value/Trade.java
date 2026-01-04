package so.morton.api.storage.value;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum Trade {
    DESIGN("설계"),
    DEMOLITION("철거, 확장"),
    MASONRY("미장, 조적, 방수"),
    PLUMBING("설비, 배관, 전기"),
    CARPENTRY("목공, 금속, 유리, 창호"),
    PAINTING("도배, 도장, 탄성코트, 필름·시트"),
    FLOORING("타일, 줄눈, 바닥, 마루, 장판"),
    FURNITURE("가구, 주방, 싱크대, 욕실"),
    TRANSPORT("운송, 중장비, 양중, 곰방"),
    CLEANING("청소, 간판, 수리");

    private final String description;
}
