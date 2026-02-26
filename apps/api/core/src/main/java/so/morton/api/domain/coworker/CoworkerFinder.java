package so.morton.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.storage.value.CoworkerStatus;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class CoworkerFinder {

    private final CoworkerRepository coworkerRepository;

    public Coworker find(Long id) {
        return coworkerRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .map(Coworker::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Coworker> findAcceptedByProfileId(Long profileId) {
        List<Coworker> fromList = coworkerRepository.findByFromIdAndStatusAndDeletedFalse(
                        profileId, CoworkerStatus.ACCEPTED)
                .stream()
                .map(Coworker::of)
                .toList();
        List<Coworker> toList = coworkerRepository.findByToIdAndStatusAndDeletedFalse(
                        profileId, CoworkerStatus.ACCEPTED)
                .stream()
                .map(Coworker::of)
                .toList();
        return Stream.concat(fromList.stream(), toList.stream()).toList();
    }
}
