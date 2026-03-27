package so.morton.api.storage.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.EntityManager;
import so.morton.api.config.UnitTest;
import so.morton.api.storage.domain.profile.ProfileEntity;
import so.morton.api.storage.domain.profile.ProfileRepository;
import so.morton.api.storage.value.Trade;
import so.morton.api.support.fixture.ProfileFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@UnitTest
@DisplayName("ProfileRepository 테스트")
class ProfileRepositoryTest {

    @Autowired private ProfileRepository profileRepository;
    @Autowired private EntityManager entityManager;

    private static final Long MEMBER_ID = 1L;

    @Nested
    @DisplayName("ProfileRepository.save & findById")
    class SaveAndFindByIdTests {

        @Test
        @DisplayName("저장 후 조회 성공")
        void save_and_findById() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(MEMBER_ID);

            // when
            ProfileEntity saved = profileRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<ProfileEntity> found = profileRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getId()).isEqualTo(saved.getId());
            assertThat(found.get().getMemberId()).isEqualTo(MEMBER_ID);
            assertThat(found.get().getPrimaryTrade()).isEqualTo(Trade.ELECTRICAL);
            assertThat(found.get().getExperience()).isEqualTo(5);
        }

        @Test
        @DisplayName("미존재 시 빈 Optional")
        void findById_notExists() {
            // when
            Optional<ProfileEntity> found = profileRepository.findById(999L);

            // then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("ProfileRepository.findAll")
    class FindAllTests {

        @Test
        @DisplayName("빈 DB 시 빈 리스트")
        void findAll_empty() {
            // when
            List<ProfileEntity> result = profileRepository.findAll();

            // then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("ProfileRepository.findByMemberId")
    class FindByMemberIdTests {

        @Test
        @DisplayName("memberId 조회 성공")
        void findByMemberId_success() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(MEMBER_ID);
            profileRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            Optional<ProfileEntity> found = profileRepository.findByMemberId(MEMBER_ID);

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getMemberId()).isEqualTo(MEMBER_ID);
        }

        @Test
        @DisplayName("미존재 memberId 시 빈 Optional")
        void findByMemberId_notExists() {
            // when
            Optional<ProfileEntity> found = profileRepository.findByMemberId(999L);

            // then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("ProfileRepository soft-delete behavior")
    class SoftDeleteTests {

        @Test
        @DisplayName("삭제 후 findAll 제외")
        void softDelete_excludeFromFindAll() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(MEMBER_ID);
            ProfileEntity saved = profileRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            profileRepository.delete(saved);
            entityManager.flush();
            entityManager.clear();

            List<ProfileEntity> result = profileRepository.findAll();

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("삭제 후 findById 제외")
        void softDelete_excludeFromFindById() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(MEMBER_ID);
            ProfileEntity saved = profileRepository.save(entity);
            Long savedId = saved.getId();
            entityManager.flush();
            entityManager.clear();

            // when
            profileRepository.delete(saved);
            entityManager.flush();
            entityManager.clear();

            Optional<ProfileEntity> found = profileRepository.findById(savedId);

            // then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("ProfileRepository @ElementCollection trades")
    class ElementCollectionTradesTests {

        @Test
        @DisplayName("trades 저장 후 조회")
        void save_withTrades_elementCollection() {
            // given
            Set<Trade> trades = Set.of(Trade.ELECTRICAL, Trade.PLUMBING, Trade.CARPENTRY);
            ProfileEntity entity = ProfileEntity.builder()
                    .memberId(MEMBER_ID)
                    .primaryTrade(Trade.ELECTRICAL)
                    .trades(trades)
                    .experience(5)
                    .headline("headline")
                    .about("about")
                    .address(ProfileFactory.ADDRESS)
                    .build();

            // when
            ProfileEntity saved = profileRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<ProfileEntity> found = profileRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getTrades()).hasSize(3);
            assertThat(found.get().getTrades()).containsExactlyInAnyOrder(
                    Trade.ELECTRICAL, Trade.PLUMBING, Trade.CARPENTRY
            );
        }

        @Test
        @DisplayName("빈 trades 저장")
        void save_withEmptyTrades() {
            // given
            ProfileEntity entity = ProfileEntity.builder()
                    .memberId(MEMBER_ID)
                    .primaryTrade(Trade.ELECTRICAL)
                    .trades(new HashSet<>())
                    .experience(5)
                    .headline("headline")
                    .about("about")
                    .address(ProfileFactory.ADDRESS)
                    .build();

            // when
            ProfileEntity saved = profileRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<ProfileEntity> found = profileRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getTrades()).isEmpty();
        }

        @Test
        @DisplayName("flush/clear 후 trades 접근")
        void lazyInit_trades_afterClear() {
            // given
            ProfileEntity profile = profileRepository.save(ProfileEntity.builder()
                    .memberId(MEMBER_ID)
                    .primaryTrade(Trade.ELECTRICAL)
                    .trades(Set.of(Trade.ELECTRICAL))
                    .experience(5)
                    .headline("headline")
                    .about("about")
                    .address(ProfileFactory.ADDRESS)
                    .build());
            entityManager.flush();
            entityManager.clear();

            // when
            ProfileEntity found = profileRepository.findById(profile.getId()).orElseThrow();

            // then - accessing trades should not throw LazyInitializationException
            // because we're still within the transaction
            assertThat(found.getTrades()).hasSize(1);
            assertThat(found.getTrades()).contains(Trade.ELECTRICAL);
        }
    }
}
