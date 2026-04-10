package so.morton.api.storage.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.EntityManager;
import so.morton.api.config.UnitTest;
import so.morton.api.storage.domain.post.PostEntity;
import so.morton.api.storage.domain.post.PostRepository;
import so.morton.api.support.fixture.PostFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@UnitTest
@DisplayName("PostRepository 테스트")
class PostRepositoryTest {

    @Autowired private PostRepository postRepository;
    @Autowired private EntityManager entityManager;

    private static final Long AUTHOR_ID = 1L;
    private static final Long TASK_ID = 1L;

    @Nested
    @DisplayName("PostRepository.save & findById")
    class SaveAndFindByIdTests {

        @Test
        @DisplayName("저장 후 조회 성공")
        void save_and_findById() {
            // given
            PostEntity entity = PostFactory.createEntity(AUTHOR_ID, TASK_ID);

            // when
            PostEntity saved = postRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<PostEntity> found = postRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getId()).isEqualTo(saved.getId());
            assertThat(found.get().getProfileId()).isEqualTo(AUTHOR_ID);
            assertThat(found.get().getTaskId()).isEqualTo(TASK_ID);
            assertThat(found.get().getContent()).isEqualTo("content");
        }

        @Test
        @DisplayName("미존재 시 빈 Optional")
        void findById_notExists() {
            // when
            Optional<PostEntity> found = postRepository.findById(999L);

            // then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("PostRepository.findAll")
    class FindAllTests {

        @Test
        @DisplayName("빈 DB 시 빈 리스트")
        void findAll_empty() {
            // when
            List<PostEntity> result = postRepository.findAll();

            // then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("PostRepository.findByProfileId")
    class FindByProfileIdTests {

        @Test
        @DisplayName("profileId 조회 성공")
        void findByProfileId_success() {
            // given
            PostEntity entity = PostFactory.createEntity(AUTHOR_ID, TASK_ID);
            postRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            List<PostEntity> result = postRepository.findByProfileId(AUTHOR_ID);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getProfileId()).isEqualTo(AUTHOR_ID);
        }
    }

    @Nested
    @DisplayName("PostRepository.findByTaskId")
    class FindByTaskIdTests {

        @Test
        @DisplayName("taskId 조회 성공")
        void findByTaskId_success() {
            // given
            PostEntity entity = PostFactory.createEntity(AUTHOR_ID, TASK_ID);
            postRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            List<PostEntity> result = postRepository.findByTaskId(TASK_ID);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.getFirst().getTaskId()).isEqualTo(TASK_ID);
        }
    }

    @Nested
    @DisplayName("PostRepository soft-delete behavior")
    class SoftDeleteTests {

        @Test
        @DisplayName("삭제 후 findAll 제외")
        void softDelete_excludeFromFindAll() {
            // given
            PostEntity entity = PostFactory.createEntity(AUTHOR_ID, TASK_ID);
            PostEntity saved = postRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            postRepository.delete(saved);
            entityManager.flush();
            entityManager.clear();

            List<PostEntity> result = postRepository.findAll();

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("삭제 후 findById 제외")
        void softDelete_excludeFromFindById() {
            // given
            PostEntity entity = PostFactory.createEntity(AUTHOR_ID, TASK_ID);
            PostEntity saved = postRepository.save(entity);
            Long savedId = saved.getId();
            entityManager.flush();
            entityManager.clear();

            // when
            postRepository.delete(saved);
            entityManager.flush();
            entityManager.clear();

            Optional<PostEntity> found = postRepository.findById(savedId);

            // then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("PostRepository @ElementCollection images")
    class ElementCollectionImagesTests {

        @Test
        @DisplayName("images 저장 후 조회")
        void save_withImages_elementCollection() {
            // given
            List<String> images = List.of("photo1.jpg", "photo2.png", "photo3.webp");
            PostEntity entity = PostEntity.builder()
                    .profileId(AUTHOR_ID)
                    .taskId(TASK_ID)
                    .images(images)
                    .content("content")
                    .build();

            // when
            PostEntity saved = postRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<PostEntity> found = postRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getImages()).hasSize(3);
            assertThat(found.get().getImages()).containsExactlyInAnyOrder(
                    "photo1.jpg", "photo2.png", "photo3.webp"
            );
        }

        @Test
        @DisplayName("빈 images 저장")
        void save_withEmptyImages() {
            // given
            PostEntity entity = PostEntity.builder()
                    .profileId(AUTHOR_ID)
                    .taskId(TASK_ID)
                    .images(new ArrayList<>())
                    .content("content")
                    .build();

            // when
            PostEntity saved = postRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<PostEntity> found = postRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getImages()).isEmpty();
        }

        @Test
        @DisplayName("flush/clear 후 images 접근")
        void lazyInit_images_afterClear() {
            // given
            PostEntity entity = PostEntity.builder()
                    .profileId(AUTHOR_ID)
                    .taskId(TASK_ID)
                    .images(List.of("lazy1.jpg", "lazy2.jpg"))
                    .content("content")
                    .build();

            // when
            PostEntity saved = postRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            PostEntity found = postRepository.findById(saved.getId()).orElseThrow();

            // then - accessing images should not throw LazyInitializationException
            // because we're still within the transaction
            assertThat(found.getImages()).hasSize(2);
            assertThat(found.getImages()).containsExactlyInAnyOrder("lazy1.jpg", "lazy2.jpg");
        }
    }
}
