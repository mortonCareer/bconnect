package to.bconnect.api.support.push;

import java.util.Map;

public record PushPayload(
        String title,
        String body,
        String url,
        Map<String, String> data
) {}
