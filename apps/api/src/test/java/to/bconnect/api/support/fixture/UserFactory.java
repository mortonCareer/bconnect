package to.bconnect.api.support.fixture;

import to.bconnect.api.storage.value.Role;
import to.bconnect.api.security.User;

public class UserFactory {

    public static final User FOREMAN_USER = new User(1L, "foreman", "FOREMAN");
    public static final User CONTRACTOR_USER = new User(1L, "contractor", "CONTRACTOR");
    public static final User GUEST_USER = new User(1L, "guest", "GUEST");
    public static final User ADMIN_USER = new User(1L, "admin", "ADMIN");

    public static User create(Long id, Role role) {
        return new User(id, "user" + id, role.toString());
    }
}
