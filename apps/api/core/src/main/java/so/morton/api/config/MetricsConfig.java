package so.morton.api.config;

import io.micrometer.core.instrument.binder.MeterBinder;
import io.micrometer.core.instrument.binder.system.ProcessorMetrics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 컨테이너 환경(Railway 등)에서 ProcessorMetrics cgroup 호환성 문제 대응.
 * JDK 17 + cgroup v2 환경에서 CgroupInfo.getMountPoint() NPE가 발생할 수 있어
 * 자동 설정 대신 직접 Bean을 등록하고, 실패 시 경고만 남긴다.
 */
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
