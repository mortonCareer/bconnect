package to.bconnect.api.notification.infrastructure.push;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;

@Configuration
@Profile("dev | prod | sns")
public class SnsConfig {

    @Bean
    public SnsClient snsClient(SnsProperties properties, AwsCredentialsProvider credentialsProvider) {
        return SnsClient.builder()
                .region(Region.of(properties.region()))
                .credentialsProvider(credentialsProvider)
                .build();
    }
}
