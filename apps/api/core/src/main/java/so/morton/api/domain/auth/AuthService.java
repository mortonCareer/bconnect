package so.morton.api.domain.auth;

public interface AuthService {

    // TODO: 반환 타입 및 구현
    void sendOtp(String phoneNumber, String agent, String ip);

    // TODO: 반환 타입 및 구현
    void verifyOtp(String phoneNumber, String code, String agent, String ip);

    // TODO: 반환 타입 및 구현
    void refresh(String refreshToken);

    // TODO: 반환 타입 및 구현
    void logout(String username);
}
