package to.bconnect.api.support.cloudfront;

import lombok.val;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.cloudfront.CloudFrontUtilities;
import software.amazon.awssdk.services.cloudfront.model.CustomSignerRequest;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
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
    private final PrivateKey key;

    public CloudFrontSignedCookieIssuer(CloudFrontProperties properties) {
        this.properties = properties;
        this.utilities = CloudFrontUtilities.create();
        this.key = parsePrivateKey(properties.privateKey());
    }

    @Override
    public List<ResponseCookie> issue(String path) {
        val url = "https://" + properties.domain() + "/" + path;
        val request = CustomSignerRequest.builder()
                .resourceUrl(url)
                .privateKey(key)
                .keyPairId(properties.keyPairId())
                .expirationDate(Instant.now().plus(properties.cookieTtl()))
                .build();

        val cookies = utilities.getCookiesForCustomPolicy(request);

        return Stream.of(
                        cookies.policyHeaderValue(),
                        cookies.signatureHeaderValue(),
                        cookies.keyPairIdHeaderValue())
                .map(this::toResponseCookie)
                .toList();
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

    private PrivateKey parsePrivateKey(String base64Pem) {
        val pem = new String(Base64.getDecoder().decode(base64Pem), StandardCharsets.UTF_8);
        val content = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        val decoded = Base64.getDecoder().decode(content);
        try {
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decoded));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("failed at parsing CloudFront private key", e);
        }
    }
}
