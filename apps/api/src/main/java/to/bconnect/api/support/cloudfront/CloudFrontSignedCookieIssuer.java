package to.bconnect.api.support.cloudfront;

import lombok.val;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.cloudfront.CloudFrontUtilities;
import software.amazon.awssdk.services.cloudfront.model.CustomSignerRequest;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

/**
 * References <br/>
 * - <a href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-setting-signed-cookie-custom-policy.html">Set signed cookies using a canned policy</a> <br/>
 * - <a href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-trusted-signers.html">Specify signers that can create signed URLs and signed cookies</a>
 * - <a href="https://docs.aws.amazon.com/java/api/latest/software/amazon/awssdk/services/cloudfront/CloudFrontUtilities.html">Class CloudFrontUtilities</a> <br/>
 */
@Component
@Profile({"prod", "dev"})
public class CloudFrontSignedCookieIssuer implements SignedCookieIssuer {

    private final CloudFrontProperties properties;
    private final CloudFrontUtilities utilities;
    private final Path privateKeyPath;

    public CloudFrontSignedCookieIssuer(CloudFrontProperties properties) {
        this.properties = properties;
        this.utilities = CloudFrontUtilities.create();
        this.privateKeyPath = Path.of(properties.privateKeyPath());
    }

    @Override
    public List<ResponseCookie> issue(String path) {
        val url = "https://" + properties.domain() + "/" + path;
        val request = buildRequest(url);
        val cookies = utilities.getCookiesForCustomPolicy(request);

        return Stream.of(
                        cookies.policyHeaderValue(),
                        cookies.signatureHeaderValue(),
                        cookies.keyPairIdHeaderValue())
                .map(this::toResponseCookie)
                .toList();
    }

    private CustomSignerRequest buildRequest(String url) {
        try {
            return CustomSignerRequest.builder()
                    .resourceUrl(url)
                    .privateKey(privateKeyPath)
                    .keyPairId(properties.keyPairId())
                    .expirationDate(Instant.now().plus(properties.cookieTtl()))
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("failed at loading CloudFront private key: " + privateKeyPath, e);
        }
    }

    private ResponseCookie toResponseCookie(String header) {
        val eq = header.indexOf('=');
        return ResponseCookie.from(header.substring(0, eq), header.substring(eq + 1))
                .domain(properties.cookieDomain())
                .path("/")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .build();
    }
}
