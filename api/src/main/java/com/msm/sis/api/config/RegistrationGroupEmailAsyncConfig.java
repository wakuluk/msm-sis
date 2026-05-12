package com.msm.sis.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class RegistrationGroupEmailAsyncConfig {

    @Bean(name = "registrationGroupEmailExecutor")
    public Executor registrationGroupEmailExecutor(
            @Value("${app.email.notifications.executor.core-pool-size:2}") int corePoolSize,
            @Value("${app.email.notifications.executor.max-pool-size:4}") int maxPoolSize,
            @Value("${app.email.notifications.executor.queue-capacity:100}") int queueCapacity
    ) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("registration-email-");
        executor.initialize();
        return executor;
    }
}
