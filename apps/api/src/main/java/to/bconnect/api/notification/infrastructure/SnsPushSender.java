package to.bconnect.api.notification.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.EndpointDisabledException;
import software.amazon.awssdk.services.sns.model.InvalidParameterException;
import software.amazon.awssdk.services.sns.model.NotFoundException;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import to.bconnect.api.notification.domain.push.PushNotification;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

import static to.bconnect.api.common.CommonUtils.mask;
import static to.bconnect.api.common.CommonUtils.nullToEmpty;

/**
 * References <br/>
 * - <a href="https://docs.aws.amazon.com/sns/latest/dg/sns-mobile-application-as-subscriber.html">Mobile push notifications</a> <br/>
 * - <a href="https://docs.aws.amazon.com/sns/latest/dg/sns-fcm-http-v1-examples.html">FCM HTTP v1 message payload examples</a>
 */
@Slf4j
@Component
@Profile({"prod", "dev"})
@RequiredArgsConstructor
public class SnsPushSender implements PushSender {

    private final SnsClient snsClient;
    private final ObjectMapper objectMapper;

    @Override
    public PushSendResult send(String endpoint, PushNotification command) {
        try {
            snsClient.publish(PublishRequest.builder()
                    .targetArn(endpoint)
                    .messageStructure("json")
                    .message(message(command))
                    .build());
            return PushSendResult.SUCCESS;
        } catch (EndpointDisabledException | NotFoundException e) {
            return PushSendResult.EXPIRED;
        } catch (InvalidParameterException e) {
            val reason = nullToEmpty(e.getMessage()).toLowerCase();
            if (reason.contains("endpoint") || reason.contains("targetarn") || reason.contains("target arn")) {
                return PushSendResult.INVALID;
            }
            log.warn("SNS publish InvalidParameter(비-endpoint): endpoint={}, reason={}", mask(endpoint), e.getMessage());
            return PushSendResult.FAILED;
        } catch (Exception e) {
            log.warn("SNS publish 실패: endpoint={}, reason={}", mask(endpoint), e.getMessage());
            return PushSendResult.FAILED;
        }
    }

    // FCM v1 message.data 는 값이 모두 String 이어야 한다
    private String message(PushNotification command) {
        val title = command.title();
        val referenceType = command.referenceType();
        val referenceId = command.referenceId();

        val data = new HashMap<String, String>();
        data.put("notification_id", String.valueOf(command.id()));
        data.put("reference_type", referenceType == null ? "" : referenceType.name().toLowerCase());
        data.put("reference_id", referenceId == null ? "" : String.valueOf(referenceId));

        val fcmV1 = Map.of("fcmV1Message", Map.of("message", Map.of(
                "notification", Map.of(
                        "title", title,
                        "body", command.body()),
                "data", data)));
        val message = Map.of(
                "default", title,
                "GCM", objectMapper.writeValueAsString(fcmV1)
        );
        return objectMapper.writeValueAsString(message);
    }
}
