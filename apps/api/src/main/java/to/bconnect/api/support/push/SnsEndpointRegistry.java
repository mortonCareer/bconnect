package to.bconnect.api.support.push;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.CreatePlatformEndpointRequest;
import software.amazon.awssdk.services.sns.model.DeleteEndpointRequest;
import software.amazon.awssdk.services.sns.model.InvalidParameterException;
import software.amazon.awssdk.services.sns.model.SetEndpointAttributesRequest;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Profile({"dev", "prod"})
@RequiredArgsConstructor
public class SnsEndpointRegistry implements PushEndpointRegistry {

    private static final Pattern EXISTING_ARN = Pattern.compile("Endpoint (arn:aws:sns:\\S+) already exists");

    private final SnsClient snsClient;
    private final SnsProperties properties;

    @Override
    public String ensureEndpoint(String token) {
        String endpointArn = createOrRecoverEndpoint(token);
        snsClient.setEndpointAttributes(SetEndpointAttributesRequest.builder()
                .endpointArn(endpointArn)
                .attributes(Map.of("Token", token, "Enabled", "true"))
                .build());
        return endpointArn;
    }

    private String createOrRecoverEndpoint(String token) {
        try {
            return snsClient.createPlatformEndpoint(CreatePlatformEndpointRequest.builder()
                            .platformApplicationArn(properties.platformApplicationArn())
                            .token(token)
                            .build())
                    .endpointArn();
        } catch (InvalidParameterException e) {
            Matcher matcher = EXISTING_ARN.matcher(e.getMessage() == null ? "" : e.getMessage());
            if (matcher.find()) {
                return matcher.group(1);
            }
            throw e;
        }
    }

    @Override
    public void deleteEndpoint(String endpointArn) {
        snsClient.deleteEndpoint(DeleteEndpointRequest.builder()
                .endpointArn(endpointArn)
                .build());
    }
}
