package wap.web2.server.admin.controller;

import static wap.web2.server.util.SemesterGenerator.generateSemester;

import io.swagger.v3.oas.annotations.Operation;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.dto.request.TeamBuildingStatusRequest;
import wap.web2.server.admin.service.AdminTeamBuildingService;
import wap.web2.server.admin.service.TeamBuildingExportService;

@RestController
@RequestMapping("/admin/team")
@RequiredArgsConstructor
public class AdminTeamBuildingController {

    private final TeamBuildingExportService exportService;
    private final AdminTeamBuildingService adminTeamBuildingService;

    // 현재 상태를 가져오는 api

    // apply와 recruit이 준비되었을 때 팀 빌딩 알고리즘 실행 트리거
    @PostMapping("/building/run")
    @Operation(summary = "팀 생성하기", description = "팀 지원과 팀원 모집이 완료되면 팀을 생성합니다.")
    public ResponseEntity<?> makeTeam() {
        try {
            adminTeamBuildingService.makeTeam();
            return ResponseEntity.ok().body("[INFO ] 성공적으로 분배하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 분배 실패" + e.getMessage());
        }
    }

    // TODO: status request를 역직렬화할 때 예외가 발생한다면
    @PatchMapping("/building/status")
    @Operation(summary = "팀빌딩 기능 상태 변경", description = "팀빌딩 기능의 상태를 열림, 지원중, 모집중, 닫힘 중 1가지로 변경합니다.")
    public ResponseEntity<?> changeStatus(@RequestBody TeamBuildingStatusRequest statusRequest) {
        adminTeamBuildingService.changeStatus(statusRequest);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/building/open/current")
    @Operation(summary = "현재 학기의 팀빌딩 기능 생성", description = "현재 학기 팀빌딩 기능을 생성합니다.")
    public ResponseEntity<?> openTeamBuilding() {
        adminTeamBuildingService.openTeamBuilding(generateSemester());
        return ResponseEntity.ok().build();
    }

    // 지원 현황 반환 (.CSV)
    @GetMapping(value = "/applies/export", produces = "text/csv; charset=UTF-8")
    @Operation(summary = "지원 현황을 CSV로 내보내기", description = "현재까지 완성된 지원현황을 CSV 형식으로 내보냅니다.")
    public ResponseEntity<byte[]> exportAppliesCsv() {
        byte[] bytes = exportService.generateAppliesCsvBytes();

        String filename = "applies_" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .contentLength(bytes.length)
                .body(bytes);
    }

    // 모집 현황 반환 (.CSV)
    @GetMapping(value = "/recruits/export", produces = "text/csv; charset=UTF-8")
    @Operation(summary = "모집 현황을 CSV로 내보내기", description = "현재까지 완성된 모집현황을 CSV 형식으로 내보냅니다.")
    public ResponseEntity<byte[]> exportRecruitsCsv() {
        byte[] bytes = exportService.generateRecruitsCsvBytes();

        String filename = "recruits_" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .contentLength(bytes.length)
                .body(bytes);
    }

}
