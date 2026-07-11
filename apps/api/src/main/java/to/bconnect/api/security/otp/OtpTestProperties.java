package to.bconnect.api.security.otp;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app.otp.test")
public record OtpTestProperties(List<String> numbers, String code) {

    public OtpTestProperties {
        if (numbers == null) numbers = List.of();
    }

    public boolean isTestNumber(String phone) {
        return code != null && numbers.contains(phone);
    }
}
