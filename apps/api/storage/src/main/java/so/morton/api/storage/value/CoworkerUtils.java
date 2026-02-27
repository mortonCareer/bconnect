package so.morton.api.storage.value;

public class CoworkerUtils {
    public static String pairOf(Long a, Long b) {
        return Math.min(a, b) + "_" + Math.max(a, b);
    }
}