package wap.web2.server.project.entity;

import jakarta.persistence.*;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    @Column(length = 2048)
    private String imageFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    public static List<Image> listOf(List<String> imageUrls) {
        return imageUrls.stream()
                .map(url -> Image.builder()
                        .imageFile(url).build())
                .toList();
    }

    public void updateImage(Project project) {
        this.project = project;
    }
}
