package to.bconnect.api.notification.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;

/**
 * References <br/>
 * - <a href="https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-chain.html">Developer Guide for version 2.x</a> <br/>
 * - <a href="https://docs.aws.amazon.com/java/api/latest/software/amazon/awssdk/services/sns/SnsClient.html">Interface SnsClient</a>
 */
@Configuration
@Profile({"prod", "dev"})
public class SnsConfig {

    @Bean
    public SnsClient snsClient(SnsProperties properties, AwsCredentialsProvider credentialsProvider) {
        return SnsClient.builder()
            .region(Region.of(properties.region()))
            .credentialsProvider(credentialsProvider)
            .build();
    }
}
