package wap.web2.server.member.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;
import wap.web2.server.comment.entity.Comment;
import wap.web2.server.project.entity.Project;

@Entity
@DynamicUpdate
@Getter
@Setter // User 엔티티만 Setter 사용
@Table(name = "user", uniqueConstraints = { @UniqueConstraint(columnNames = "email") })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userId")
    private Long id;

    @Column(nullable = false)
    private String name;

    @Email
    @Column(nullable = false)
    private String email;

    @Column
    private String imageUrl;

    @Column(nullable = false)
    private Boolean emailVerified = false;

    @Column
    @JsonIgnore
    private String password;

    @Column
    @NotNull
    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    @Column
    private String providerId;

    @Column
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "member_type")
    @Enumerated(EnumType.STRING)
    private MemberType memberType;

    @Column(name = "registration_required", nullable = false)
    private boolean registrationRequired;

    @JsonIgnore
    @Column(name = "wap_member")
    private Boolean wapMember;

    @JsonIgnore
    @Column(name = "student_id", length = 9)
    private String studentId;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Project> projects = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Comment> comments = new ArrayList<>();
}
