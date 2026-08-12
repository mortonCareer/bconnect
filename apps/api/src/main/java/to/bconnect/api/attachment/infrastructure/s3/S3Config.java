package to.bconnect.api.attachment.infrastructure.s3;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * References
 * - <a href="https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-chain.html">Developer Guide for version 2.x</a>
 */
@Configuration
@Profile({"prod", "dev"})
public class S3Config {

    @Bean
    public AwsCredentialsProvider awsCredentialsProvider() {
        return DefaultCredentialsProvider.builder().build();
    }

    @Bean
    public S3Client s3Client(S3Properties properties, AwsCredentialsProvider credentialsProvider) {
        return S3Client.builder()
            .region(Region.of(properties.region()))
            .credentialsProvider(credentialsProvider)
            .build();
    }

    @Bean
    public S3Presigner s3Presigner(S3Properties properties, AwsCredentialsProvider credentialsProvider) {
        return S3Presigner.builder()
            .region(Region.of(properties.region()))
            .credentialsProvider(credentialsProvider)
            .build();
    }
}
