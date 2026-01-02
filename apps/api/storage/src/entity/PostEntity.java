package io.gongbang.api.infrastructure.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostEntity extends BaseEntity {

    @JoinColumn(name = "author_id", nullable = true)
    private Long author_id;

    @JoinColumn(name = "task_id", nullable = true)
    private Long task_id;

    @ElementCollection
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    private List<String> images = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String content;

    @Builder
    public PostEntity(UserEntity author, TaskEntity task, List<String> images, String content) {
        this.author = author.id;
        this.task = task.id;
        this.images = images != null ? images : new ArrayList<>();
        this.content = content;
    }
}
