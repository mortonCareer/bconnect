package so.morton.api.storage.config;

import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
@EntityScan(basePackages = "so.morton.api.storage.domain")
@EnableJpaRepositories(basePackages = "so.morton.api.storage.domain")
public class StorageJpaConfig {
}
