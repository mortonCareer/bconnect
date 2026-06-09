package to.bconnect.api.support.fixture;

import to.bconnect.api.storage.member.Role;
import to.bconnect.api.security.AuthUser;

public class UserFactory {

    public static final AuthUser FOREMAN_USER = new AuthUser(1L, "foreman", "FOREMAN");
    public static final AuthUser CONTRACTOR_USER = new AuthUser(1L, "contractor", "CONTRACTOR");
    public static final AuthUser GUEST_USER = new AuthUser(1L, "guest", "GUEST");
    public static final AuthUser ADMIN_USER = new AuthUser(1L, "admin", "ADMIN");

    public static AuthUser create(Long id, Role role) {
        return new AuthUser(id, "user" + id, role.toString());
    }
}
