package to.bconnect.api.notification.infrastructure.push;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.EndpointDisabledException;
import software.amazon.awssdk.services.sns.model.InvalidParameterException;
import software.amazon.awssdk.services.sns.model.NotFoundException;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@Profile({"dev", "prod"})
@RequiredArgsConstructor
public class SnsPushSender implements PushSender {

    private final SnsClient snsClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PushSendResult send(String endpointArn, PushPayload payload) {
        try {
            var response = snsClient.publish(PublishRequest.builder()
                    .targetArn(endpointArn)
                    .messageStructure("json")
                    .message(toSnsMessage(payload))
                    .build());
            return PushSendResult.success(endpointArn, response.messageId());
        } catch (EndpointDisabledException | NotFoundException e) {
            return PushSendResult.expired(endpointArn);
        } catch (InvalidParameterException e) {
            if (isEndpointRelated(e.getMessage())) {
                return PushSendResult.invalid(endpointArn);
            }
            log.warn("SNS publish InvalidParameter(비-endpoint) endpointArn={}, reason={}", mask(endpointArn), e.getMessage());
            return PushSendResult.failed(endpointArn);
        } catch (Exception e) {
            log.warn("SNS publish 실패 endpointArn={}, reason={}", mask(endpointArn), e.getMessage());
            return PushSendResult.failed(endpointArn);
        }
    }

    private static boolean isEndpointRelated(String message) {
        if (message == null) return false;
        String lower = message.toLowerCase();
        return lower.contains("endpoint") || lower.contains("targetarn") || lower.contains("target arn");
    }

    private static String mask(String value) {
        if (value == null || value.length() < 12) return "***";
        return value.substring(0, 8) + "...";
    }

    private String toSnsMessage(PushPayload payload) {
        try {
            Map<String, String> data = new HashMap<>();
            data.put("title", payload.title());
            data.put("body", payload.body());
            data.put("link", payload.link());
            if (payload.data() != null) data.putAll(payload.data());

            Map<String, Object> fcmV1 = Map.of(
                    "fcmV1Message", Map.of(
                            "message", Map.of(
                                    "data", data
                            )
                    )
            );

            Map<String, String> snsMessage = Map.of(
                    "default", payload.title(),
                    "GCM", objectMapper.writeValueAsString(fcmV1)
            );

            return objectMapper.writeValueAsString(snsMessage);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to build SNS push payload", e);
        }
    }
}
