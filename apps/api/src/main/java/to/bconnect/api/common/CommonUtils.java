package to.bconnect.api.common;

public class CommonUtils {

    public static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    public static String mask(String value) {
        if (value == null || value.length() < 12) return "***";
        return value.substring(0, 8) + "...";
    }

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return "***";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    public static String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
