package wap.web2.server.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.service.AdminTeamBuildingService;

@RestController
@RequestMapping("/admin/team-build")
@RequiredArgsConstructor
public class AdminTeamBuildingController {

    private final AdminTeamBuildingService adminTeamBuildingService;

    // apply와 recruit이 준비되었을 때 팀 빌딩 알고리즘 실행 트리거
    @PostMapping("/building")
    @Operation(summary = "팀 생성하기", description = "팀 지원과 팀원 모집이 완료되면 팀을 생성합니다.")
    public ResponseEntity<?> makeTeam() {
        try {
            adminTeamBuildingService.makeTeam();
            return ResponseEntity.ok().body("[INFO ] 성공적으로 분배하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 분배 실패" + e.getMessage());
        }
    }
}
