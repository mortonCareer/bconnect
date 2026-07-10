package to.bconnect.api.core.domain.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record NotificationArgs(Map<String, String> values) {

    public static final String SENDER_NAME = "senderName";
    public static final String COMPANY_NAME = "companyName";

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> MAP_TYPE = new TypeReference<>() {};

    public NotificationArgs {
        Map<String, String> copied = new LinkedHashMap<>();
        if (values != null) {
            values.forEach((key, value) -> {
                if (key != null) copied.put(key, value == null ? "" : value);
            });
        }
        values = Collections.unmodifiableMap(copied);
    }

    public static NotificationArgs empty() {
        return new NotificationArgs(Map.of());
    }

    public static NotificationArgs of(String key, String value) {
        return new NotificationArgs(Map.of(key, value == null ? "" : value));
    }

    public static NotificationArgs senderName(String senderName) {
        return of(SENDER_NAME, senderName);
    }

    public static NotificationArgs companyName(String companyName) {
        return of(COMPANY_NAME, companyName);
    }

    public static NotificationArgs fromJson(String json) {
        if (json == null || json.isBlank()) return empty();
        try {
            return new NotificationArgs(OBJECT_MAPPER.readValue(json, MAP_TYPE));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse notification args", e);
        }
    }

    public String get(String key) {
        return values.getOrDefault(key, "");
    }

    public boolean isEmpty() {
        return values.isEmpty();
    }

    public String toJson() {
        try {
            return OBJECT_MAPPER.writeValueAsString(values);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize notification args", e);
        }
    }
}
