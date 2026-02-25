package so.morton.api.config;

import io.micrometer.core.instrument.binder.MeterBinder;
import io.micrometer.core.instrument.binder.system.ProcessorMetrics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    private static final Logger log = LoggerFactory.getLogger(MetricsConfig.class);

    @Bean
    public MeterBinder processorMetrics() {
        try {
            ProcessorMetrics metrics = new ProcessorMetrics();
            log.info("ProcessorMetrics 초기화 성공 - CPU 메트릭 수집 활성화");
            return metrics;
        } catch (Exception e) {
            log.warn("ProcessorMetrics 초기화 실패 (컨테이너 cgroup 호환성 문제). CPU 메트릭이 수집되지 않습니다: {}",
                    e.getMessage());
            return registry -> {};
        }
    }
}
