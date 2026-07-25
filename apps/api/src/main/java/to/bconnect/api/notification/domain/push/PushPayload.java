package to.bconnect.api.notification.domain.push;

import java.util.Map;

public record PushPayload(
        String title,
        String body,
        String link,
        Map<String, String> data
) {
    public PushPayload {
        data = data == null ? Map.of() : Map.copyOf(data);
    }
}
