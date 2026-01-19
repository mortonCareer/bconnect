package so.morton.api.support.auth;

import lombok.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record User(
    Long id,
    String username,
    String role
) implements UserDetails {

    private static final String ROLE_PREFIX = "ROLE_";

    @Override @NonNull
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(ROLE_PREFIX + role));
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override @NonNull
    public String getUsername() {
        return username;
    }
}
