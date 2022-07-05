package org.terrakube.api.plugin.security.audit;

import org.terrakube.api.plugin.security.audit.dex.DexAuditorAwareImpl;
import org.terrakube.api.plugin.security.audit.local.LocalAuditorAwareImpl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
class AuditConfig {

    @Value("${org.terrakube.api.users.type}")
    private String usersType;

    @Bean
    public AuditorAware<String> auditorProvider() {
        AuditorAware<String> auditorAware = null;
        switch (usersType) {
            case "DEX":
                auditorAware = new DexAuditorAwareImpl();
                break;
            default:
                auditorAware = new LocalAuditorAwareImpl();
                break;
        }
        return auditorAware;
    }
}
