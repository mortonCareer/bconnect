package to.bconnect.api.support.fixture;

import to.bconnect.api.storage.signup.SignupTokenEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE_TIME;

public class SignupTokenFactory {

    public static final String DEFAULT_TOKEN = "signup-token";

    public static SignupTokenEntity entity(String phone, String token) {
        return new SignupTokenEntity(phone, token, MAX_DATE_TIME);
    }
}
