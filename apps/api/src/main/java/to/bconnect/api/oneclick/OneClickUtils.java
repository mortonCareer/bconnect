package to.bconnect.api.oneclick;

import lombok.val;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Function;
import java.util.regex.Pattern;

public final class OneClickUtils {

    private static final DateTimeFormatter YYYYMMDD = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final Pattern DOTTED = Pattern.compile("(\\d{4})\\.(\\d{2})\\.(\\d{2})");
    private static final String NON_AMOUNT = "[^0-9.\\-]";

    // 상법 제19조, 등기예규 제12조 회사 종류
    private static final List<String> LEGAL_FORMS = List.of(
            "유한책임회사",
            "농업회사법인",
            "사회복지법인",
            "주식회사",
            "유한회사",
            "합자회사",
            "합명회사",
            "사단법인",
            "재단법인",
            "의료법인",
            "학교법인");

    // 등기부에는 쓸 수 없으나 실무 표기에 사용되는 약칭
    private static final Pattern LEGAL_FORM_ABBR =
            Pattern.compile("㈜|㈔|[(（]\\s*(?:유한|합자|사단|재단|주|유|합|사|재|의|자)\\s*[)）]");

    // 상호 오른쪽 끝 괄호 (등기예규 제5조 제1항)
    private static final Pattern TRAILING_PAREN = Pattern.compile("\\s*[(（][^(（)）]*[)）]\\s*$");

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final BigDecimal HUNDRED_MILLION = BigDecimal.valueOf(100_000_000L);
    private static final BigDecimal THOUSAND = BigDecimal.valueOf(1_000L);

    // 원클릭 조회 입력값(사업자등록번호·상호·대표자명) 단계 skip 판단
    public static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    // 법인격 표기와 로마자 등 병기를 제거하고 공백을 없앤다 (등기예규 제6조 제1항)
    // packages/data-jobs 의 normalizeCompanyName 과 동일 규칙이어야 적재 키와 조회 키가 맞는다
    public static String normalize(String name) {
        var result = LEGAL_FORM_ABBR.matcher(name).replaceAll("");

        while (TRAILING_PAREN.matcher(result).find())
            result = TRAILING_PAREN.matcher(result).replaceAll("");

        for (val form : LEGAL_FORMS)
            result = result.replace(form, "");

        result = WHITESPACE.matcher(result).replaceAll("");

        // 법인격 표기만으로 이루어진 값은 정규화하면 비므로 원본을 유지한다
        return result.isEmpty() ? WHITESPACE.matcher(name).replaceAll("") : result;
    }

    // 공백 제거 후 양방향 부분일치
    public static boolean match(String candidate, String companyName) {
        if (candidate == null)
            return false;
        val item = trim(candidate);
        val normalized = trim(companyName);
        return item.contains(normalized) || normalized.contains(item);
    }

    public static String trim(String name) {
        return name.replaceAll("\\s", "");
    }

    // 대표자명 필드가 존재하는 소스의 3단계 필터링, 대표자명 입력이 없으면 skip
    // 일치 행이 없으면 대표자명이 결측인 행만 남긴다. 불일치 행은 항상 제외
    public static <T> List<T> filterByRepresentative(List<T> candidates, Function<T, String> representativeOf, String ownerName) {
        if (isBlank(ownerName))
            return candidates;

        val matched = candidates.stream()
                .filter(it -> match(representativeOf.apply(it), ownerName))
                .toList();
        if (!matched.isEmpty())
            return matched;

        return candidates.stream()
                .filter(it -> isBlank(representativeOf.apply(it)))
                .toList();
    }

    // 사업자등록번호 필드를 함께 가지는 소스에서 상호 추출
    public static <T> String firstName(List<T> items, Function<T, String> nameOf) {
        return items.stream()
                .map(nameOf)
                .filter(it -> !isBlank(it))
                .findFirst()
                .orElse(null);
    }

    // 조회 순서 4단계. 사업자등록번호 필드가 있는 소스
    public static <T> List<T> lookup(
            String brn, Function<String, List<T>> byBizRegNo,
            String companyName, Function<String, List<T>> byCompanyName,
            Function<T, String> representativeOf, String ownerName) {
        if (!isBlank(brn)) {
            val matched = byBizRegNo.apply(brn);
            if (!matched.isEmpty())
                return matched;
        }
        return lookup(companyName, byCompanyName, representativeOf, ownerName);
    }

    // 조회 순서 4단계. 사업자등록번호 필드가 없는 소스
    public static <T> List<T> lookup(
            String companyName, Function<String, List<T>> byCompanyName,
            Function<T, String> representativeOf, String ownerName) {
        return filterByRepresentative(lookup(companyName, byCompanyName), representativeOf, ownerName);
    }

    // 조회 순서 4단계. 사업자등록번호와 대표자명 필드가 없는 소스
    public static <T> List<T> lookup(String companyName, Function<String, List<T>> byCompanyName) {
        if (isBlank(companyName))
            return List.of();
        return byCompanyName.apply(normalize(companyName));
    }

    public static LocalDate parseDate(Integer value) {
        return value == null ? null : parseDate(String.valueOf(value));
    }

    public static LocalDate parseDate(String value) {
        if (isBlank(value))
            return null;
        return LocalDate.parse(value.trim(), YYYYMMDD);
    }

    // 2026.03.01 표기 파싱
    public static LocalDate parseDottedDate(String value) {
        if (isBlank(value))
            return null;

        val matcher = DOTTED.matcher(value);
        if (!matcher.find())
            return null;

        return LocalDate.of(
                Integer.parseInt(matcher.group(1)),
                Integer.parseInt(matcher.group(2)),
                Integer.parseInt(matcher.group(3)));
    }

    // 원 단위 금액 표기 파싱, 소수부는 절삭
    public static Long parseWon(String value) {
        val amount = parseAmount(value);
        return amount == null ? null : amount.longValue();
    }

    // 천원 단위 금액 표기를 원 단위로 환산
    public static Long fromThousandWon(String value) {
        val amount = parseAmount(value);
        return amount == null ? null : amount.multiply(THOUSAND).longValue();
    }

    // 억원 단위 금액을 원 단위로 환산
    public static Long fromHundredMillionWon(BigDecimal value) {
        return value == null ? null : value.multiply(HUNDRED_MILLION).longValue();
    }

    private static BigDecimal parseAmount(String value) {
        if (isBlank(value))
            return null;

        val digits = value.replaceAll(NON_AMOUNT, "");
        try {
            return new BigDecimal(digits);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
