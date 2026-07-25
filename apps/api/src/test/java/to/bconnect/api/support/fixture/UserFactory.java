package to.bconnect.api.support.fixture;

import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.member.Role;

import java.util.Set;

public class UserFactory {

    public static final AuthUser SIGNUP_USER = new AuthUser(1L, "signup", Set.of(Role.SIGNUP));
    public static final AuthUser GUEST_USER = new AuthUser(1L, "guest", Set.of(Role.GUEST));
    public static final AuthUser CAREER_USER = new AuthUser(1L, "career", Set.of(Role.CAREER));
    public static final AuthUser PLAN_USER = new AuthUser(1L, "plan", Set.of(Role.PLAN));
    public static final AuthUser ADMIN_USER = new AuthUser(1L, "admin", Set.of(Role.ADMIN));

    public static AuthUser domain(Long id, Role... roles) {
        return new AuthUser(id, "user" + id, Set.of(roles));
    }
}
