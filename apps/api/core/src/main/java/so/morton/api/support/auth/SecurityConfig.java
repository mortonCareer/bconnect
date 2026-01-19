package so.morton.api.support.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import so.morton.api.config.CorsProperties;

import java.util.Collections;
import java.util.List;

import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CorsProperties corsProperties;

    @Bean
    public AuthenticationManager authenticationManagerBean(
            UserDetailsService userService,
            PasswordEncoder passwordEncoder,
            JwtProvider jwtProvider) {

        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userService);
        authProvider.setPasswordEncoder(passwordEncoder);
        JwtAuthenticationProvider jwtAuthenticationProvider = new JwtAuthenticationProvider(userService, jwtProvider);
        return new ProviderManager(authProvider, jwtAuthenticationProvider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(
            HttpSecurity http,
            AccessTokenAuthenticationFilter accessTokenAuthenticationFilter,
            RefreshTokenAuthenticationFilter refreshTokenAuthenticationFilter,
            UsernamePasswordAuthenticationSuccessHandler usernamePasswordAuthenticationSuccessHandler
    ) throws Exception {
        http
                .sessionManagement(sc -> sc.sessionCreationPolicy(STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(hc -> hc.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .cors(cc -> cc.configurationSource(req -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(corsProperties.allowedOrigins());
                    config.setAllowedMethods(Collections.singletonList("*"));
                    config.setAllowedHeaders(Collections.singletonList("*"));
                    config.setExposedHeaders(List.of("Authorization"));
                    config.setAllowCredentials(true);
                    config.setMaxAge(3600L);
                    return config;
                }))
                .formLogin(fc -> fc
                        .successHandler(usernamePasswordAuthenticationSuccessHandler))
                .authorizeHttpRequests(arc -> arc
                        .requestMatchers(GET).permitAll()
                        .requestMatchers(POST, "/v1/users").permitAll()
                        .anyRequest().authenticated())
                .addFilterAfter(accessTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(refreshTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
