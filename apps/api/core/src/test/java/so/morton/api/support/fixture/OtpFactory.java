package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.otp.OtpEntity;
import so.morton.api.storage.domain.otp.OtpRepository;

import java.time.LocalDateTime;

@Component
public class OtpFactory {

    @Autowired private OtpRepository otpRepository;

    public OtpEntity create(String phone) {
        return otpRepository.save(new OtpEntity(
                phone,
                "000000",
                LocalDateTime.now().plusMinutes(3)));
    }
}
