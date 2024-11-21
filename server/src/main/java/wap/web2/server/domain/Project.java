package wap.web2.server.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import wap.web2.server.payload.TeamMemberDto;
import wap.web2.server.payload.TechStackDto;
import wap.web2.server.payload.request.ProjectCreateRequest;
import wap.web2.server.payload.response.ProjectInfoResponse;

@Builder
@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;

    private String title;

    private String projectType;

    @Lob
    @Column(length = 9000) // 글 내용은 길이 9000 (한글 기준 3000자)
    private String content;

    private String summary;

    private Integer semester;

    private Long vote;

    private Integer projectYear;

    private String thumbnail;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Image> images = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    List<TeamMember> teamMembers = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    List<TechStack> techStacks = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    public void update(ProjectCreateRequest request, List<String> imageUrls, String thumbnailUrl) {

        // 기본 필드 업데이트
        this.title = request.getTitle();
        this.projectType = request.getProjectType();
        this.content = request.getContent();
        this.summary = request.getSummary();
        this.semester = request.getSemester();
        this.projectYear = request.getProjectYear();
        this.thumbnail = thumbnailUrl;

        // 기존 이미지 리스트 초기화 및 새로 추가
        this.images.clear();
        if (imageUrls != null && !imageUrls.isEmpty()) {
            List<Image> newImages = imageUrls.stream()
                    .map(imageDto -> Image.builder()
                            .imageFile(imageDto)
                            .project(this) // 연관관계 설정
                            .build()) // Builder 사용
                    .collect(Collectors.toList());
            this.images.addAll(newImages);
        }

        // 팀 멤버 리스트 초기화 및 새로 추가
        this.teamMembers.clear();
        if (request.getTeamMember() != null && !request.getTeamMember().isEmpty()) {
            List<TeamMember> newTeamMembers = request.getTeamMember().stream()
                    .map(TeamMemberDto::toEntity) // DTO → 엔티티 변환
                    .collect(Collectors.toList());
            this.teamMembers.addAll(newTeamMembers);
        }

        // 기술 스택 리스트 초기화 및 새로 추가
        this.techStacks.clear();
        if (request.getTechStack() != null && !request.getTechStack().isEmpty()) {
            List<TechStack> newTechStacks = request.getTechStack().stream()
                    .map(TechStackDto::toEntity) // DTO → 엔티티 변환
                    .collect(Collectors.toList());
            this.techStacks.addAll(newTechStacks);
        }

        // 기존 댓글 리스트는 요청에서 수정되지 않음

        // 연관관계 설정이 필요한 경우 추가 로직
        this.images.forEach(image -> image.updateImage(this));
        this.teamMembers.forEach(teamMember -> teamMember.updateTeamMember(this));
        this.techStacks.forEach(techStack -> techStack.updateTechStack(this));
    }

}
