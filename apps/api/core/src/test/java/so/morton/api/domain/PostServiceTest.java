package so.morton.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.post.PostFinder;
import so.morton.api.domain.post.PostService;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.post.PostEntity;
import so.morton.api.storage.domain.post.PostRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.UnitTest;
import so.morton.api.support.fixture.PostFactory;
import so.morton.api.support.fixture.ProfileFactory;
import so.morton.api.support.fixture.UserFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;

@UnitTest
@DisplayName("PostService 테스트")
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private PostFinder postFinder;
    @Mock private ProfileFinder profileFinder;
    @InjectMocks private PostService postService;

    private static final Long USER_ID = UserFactory.FOREMAN_USER.id();
    private static final Long PROFILE_ID = 1L;
    private static final Long POST_ID = 1L;
    private static final Long TASK_ID = 2L;

    @Nested
    @DisplayName("PostService.get")
    class GetTests {

        @Test
        @DisplayName("조회 성공")
        void get_success() {
            // given
            Post expectedPost = PostFactory.create(POST_ID, PROFILE_ID, TASK_ID);
            when(postFinder.find(POST_ID)).thenReturn(expectedPost);

            // when
            Post result = postService.get(POST_ID);

            // then
            assertThat(result).isEqualTo(expectedPost);
            verify(postFinder).find(POST_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void get_notFound() {
            // given
            when(postFinder.find(POST_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> postService.get(POST_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(postFinder).find(POST_ID);
        }
    }

    @Nested
    @DisplayName("PostService.getAll")
    class GetAllTests {

        @Test
        @DisplayName("조회 성공")
        void getAll_success() {
            // given
            PostEntity entity1 = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity1, "id", POST_ID);
            PostEntity entity2 = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity2, "id", 101L);

            when(postRepository.findAll()).thenReturn(List.of(entity1, entity2));

            // when
            List<Post> result = postService.getAll();

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(POST_ID);
            assertThat(result.get(1).id()).isEqualTo(101L);
            verify(postRepository).findAll();
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void getAll_empty() {
            // given
            when(postRepository.findAll()).thenReturn(List.of());

            // when
            List<Post> result = postService.getAll();

            // then
            assertThat(result).isEmpty();
            verify(postRepository).findAll();
        }
    }

    @Nested
    @DisplayName("PostService.create")
    class CreateTests {

        @Test
        @DisplayName("생성 성공")
        void create_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CreatePostRequest request = PostFactory.createRequest();

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.save(any(PostEntity.class))).thenAnswer(invocation -> {
                PostEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", POST_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Post result = postService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(POST_ID);
            assertThat(result.profileId()).isEqualTo(PROFILE_ID);
            assertThat(result.content()).isEqualTo("content");
            assertThat(result.images()).isEqualTo(List.of(PostFactory.IMAGE));
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).save(any(PostEntity.class));
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void create_profileNotFound() {
            // given
            CreatePostRequest request = PostFactory.createRequest();

            when(profileFinder.findByMemberId(USER_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> postService.create(UserFactory.FOREMAN_USER, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository, never()).save(any());
        }

        @Test
        @DisplayName("null taskId 생성 성공")
        void create_withNullTaskId() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CreatePostRequest request = new CreatePostRequest(null, List.of(PostFactory.IMAGE), "content");

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.save(any(PostEntity.class))).thenAnswer(invocation -> {
                PostEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", POST_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Post result = postService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.taskId()).isNull();
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).save(any(PostEntity.class));
        }

        @Test
        @DisplayName("단일 이미지 생성 성공")
        void create_withSingleImage() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            List<String> singleImage = List.of("single.jpg");
            CreatePostRequest request = new CreatePostRequest(TASK_ID, singleImage, "content");

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.save(any(PostEntity.class))).thenAnswer(invocation -> {
                PostEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", POST_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Post result = postService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.images()).hasSize(1);
            assertThat(result.images().get(0)).isEqualTo("single.jpg");
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).save(any(PostEntity.class));
        }
    }

    @Nested
    @DisplayName("PostService.update")
    class UpdateTests {

        @Test
        @DisplayName("수정 성공")
        void update_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            PostEntity entity = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity, "id", POST_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.findById(POST_ID)).thenReturn(Optional.of(entity));

            // when
            postService.update(UserFactory.FOREMAN_USER, POST_ID, "Updated content");

            // then
            assertThat(entity.getContent()).isEqualTo("Updated content");
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).findById(POST_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void update_notFound() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.findById(POST_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> postService.update(UserFactory.FOREMAN_USER, POST_ID, "Updated content"))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).findById(POST_ID);
        }

        @Test
        @DisplayName("타인 수정 시 FORBIDDEN")
        void update_forbidden() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            PostEntity entity = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity, "id", POST_ID);
            ReflectionTestUtils.setField(entity, "profileId", 999L); // Different author

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.findById(POST_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> postService.update(UserFactory.FOREMAN_USER, POST_ID, "Updated content"))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).findById(POST_ID);
        }
    }

    @Nested
    @DisplayName("PostService.delete")
    class DeleteTests {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            PostEntity entity = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity, "id", POST_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.findById(POST_ID)).thenReturn(Optional.of(entity));

            // when
            postService.delete(UserFactory.FOREMAN_USER, POST_ID);

            // then
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).findById(POST_ID);
            verify(postRepository).delete(entity);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void delete_notFound() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.findById(POST_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> postService.delete(UserFactory.FOREMAN_USER, POST_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).findById(POST_ID);
            verify(postRepository, never()).delete(any());
        }

        @Test
        @DisplayName("타인 삭제 시 FORBIDDEN")
        void delete_forbidden() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            PostEntity entity = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity, "id", POST_ID);
            ReflectionTestUtils.setField(entity, "profileId", 999L); // Different author

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(postRepository.findById(POST_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> postService.delete(UserFactory.FOREMAN_USER, POST_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(postRepository).findById(POST_ID);
            verify(postRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("PostFinder.find")
    class PostFinderFindTests {

        @Mock
        private PostRepository finderPostRepository;

        @InjectMocks
        private PostFinder finderPostFinder;

        @Test
        @DisplayName("조회 성공")
        void find_success() {
            // given
            PostEntity entity = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity, "id", POST_ID);
            when(finderPostRepository.findById(POST_ID)).thenReturn(Optional.of(entity));

            // when
            Post result = finderPostFinder.find(POST_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(POST_ID);
            assertThat(result.profileId()).isEqualTo(PROFILE_ID);
            assertThat(result.content()).isEqualTo("content");
            verify(finderPostRepository).findById(POST_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void find_notFound() {
            // given
            when(finderPostRepository.findById(POST_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> finderPostFinder.find(POST_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(finderPostRepository).findById(POST_ID);
        }
    }

    @Nested
    @DisplayName("PostFinder.findByProfileId")
    class PostFinderFindByProfileIdTests {

        @Mock
        private PostRepository finderPostRepository;

        @InjectMocks
        private PostFinder finderPostFinder;

        @Test
        @DisplayName("조회 성공")
        void findByProfileId_success() {
            // given
            PostEntity entity1 = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity1, "id", POST_ID);
            PostEntity entity2 = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity2, "id", 101L);

            when(finderPostRepository.findByProfileId(PROFILE_ID)).thenReturn(List.of(entity1, entity2));

            // when
            List<Post> result = finderPostFinder.findByProfileId(PROFILE_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(POST_ID);
            assertThat(result.get(1).id()).isEqualTo(101L);
            verify(finderPostRepository).findByProfileId(PROFILE_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void findByProfileId_empty() {
            // given
            when(finderPostRepository.findByProfileId(PROFILE_ID)).thenReturn(List.of());

            // when
            List<Post> result = finderPostFinder.findByProfileId(PROFILE_ID);

            // then
            assertThat(result).isEmpty();
            verify(finderPostRepository).findByProfileId(PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("PostFinder.findByTaskId")
    class PostFinderFindByTaskIdTests {

        @Mock
        private PostRepository finderPostRepository;

        @InjectMocks
        private PostFinder finderPostFinder;

        @Test
        @DisplayName("조회 성공")
        void findByTaskId_success() {
            // given
            PostEntity entity1 = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity1, "id", POST_ID);
            PostEntity entity2 = PostFactory.createEntity(PROFILE_ID, TASK_ID);
            ReflectionTestUtils.setField(entity2, "id", 101L);

            when(finderPostRepository.findByTaskId(TASK_ID)).thenReturn(List.of(entity1, entity2));

            // when
            List<Post> result = finderPostFinder.findByTaskId(TASK_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(POST_ID);
            assertThat(result.get(1).id()).isEqualTo(101L);
            verify(finderPostRepository).findByTaskId(TASK_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void findByTaskId_empty() {
            // given
            when(finderPostRepository.findByTaskId(TASK_ID)).thenReturn(List.of());

            // when
            List<Post> result = finderPostFinder.findByTaskId(TASK_ID);

            // then
            assertThat(result).isEmpty();
            verify(finderPostRepository).findByTaskId(TASK_ID);
        }
    }
}
