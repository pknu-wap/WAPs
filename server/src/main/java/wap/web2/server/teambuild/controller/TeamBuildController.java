package wap.web2.server.teambuild.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.teambuild.dto.RecruitmentDto;
import wap.web2.server.teambuild.dto.TempProject;
import wap.web2.server.teambuild.dto.TempProject;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest;
import wap.web2.server.teambuild.dto.response.ProjectAppliesResponse;
import wap.web2.server.teambuild.service.ApplyService;
import wap.web2.server.teambuild.service.TeamBuildService;

@Controller
@RequestMapping("/team-build")
@RequiredArgsConstructor
public class TeamBuildController {

    private final TeamBuildService teamBuildService;
    private final ApplyService applyService;

    // 프로젝트 신청 (for 팀원)
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@CurrentUser UserPrincipal userPrincipal,
                                   @Valid @RequestBody ProjectAppliesRequest request) {
        try {
            applyService.apply(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 지원하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 지원 실패");
        }
    }

    // 프로젝트에 신청한 사람 보기 (for 팀장)
    @GetMapping("{projectId}/applies")
    public ResponseEntity<?> getApplies(@CurrentUser UserPrincipal userPrincipal,
                                        @PathVariable("projectId") Long projectId) {
        try {
            ProjectAppliesResponse response = applyService.getApplies(userPrincipal, projectId);
            return ResponseEntity.ok().body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/preference")
    public ResponseEntity<?> setPreference(@CurrentUser UserPrincipal userPrincipal,
                                           @Valid @RequestBody RecruitmentDto request) {
        try {
            applyService.setPreference(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 등록하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 등록 실패" + e.getMessage());
        }
    }

    // TODO: userPrincipal로 admin인지 권한 검사 할 수 있을듯
    // apply와 recruit이 준비되었을 때 팀 빌딩 알고리즘을 돌리는 api
    @PostMapping("")
    public ResponseEntity<?> makeTeam(@CurrentUser UserPrincipal userPrincipal) {
        try {
            teamBuildService.makeTeam(userPrincipal);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 분배하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 분배 실패" + e.getMessage());
        }
    }

    @GetMapping("/projects")
    public String projects(Model model, @CookieValue(name = "authToken", required = false) String authToken) throws Exception {
        TempProject p1 = new TempProject(
                1L,
                "E-커머스 플랫폼 개발",
                "React와 Spring Boot를 활용한 현대적인 온라인 쇼핑몰을 구축합니다. 사용자 친화적인 UI/UX와 안정적인 결제 시스템을 포함합니다.",
                List.of("React", "Spring Boot", "MySQL", "AWS"),
                "2024-03-15"
        );

        TempProject p2 = new TempProject(
                2L,
                "AI 챗봇 서비스",
                "자연어 처리 기술을 활용한 고객 서비스 챗봇을 개발합니다. 머신러닝 모델 훈련과 API 개발이 포함됩니다.",
                List.of("Python", "TensorFlow", "FastAPI", "Docker"),
                "2024-03-20"
        );

        TempProject p3 = new TempProject(
                3L,
                "모바일 헬스케어 앱",
                "건강 관리를 위한 크로스플랫폼 모바일 애플리케이션을 개발합니다. 웨어러블 디바이스 연동과 데이터 시각화 기능을 제공합니다.",
                List.of("Flutter", "Node.js", "MongoDB", "Firebase"),
                "2024-04-01"
        );
        System.out.println("authToken = " + authToken);
        model.addAttribute("projects", List.of(p1, p2, p3));
        model.addAttribute("authToken", authToken);

        return "projects-application";
    }
}
