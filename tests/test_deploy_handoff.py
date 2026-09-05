"""Exercise the actual workflow handoff with a simulated Docker CLI."""
import os
from pathlib import Path
import subprocess
import textwrap
import tempfile
import unittest

WORKFLOW = Path(__file__).resolve().parents[1] / ".github/workflows/server-deploy.yml"


class DeploymentHandoffTest(unittest.TestCase):
    def run_handoff(self, failure="", existing=True, restart_fails=False):
        workflow = WORKFLOW.read_text()
        start = workflow.index("            had_previous=false")
        end = workflow.index("            rollback()", start)
        handoff = textwrap.dedent(workflow[start:end])
        mock = r'''
set -eu
docker() {
  printf '%s\n' "$*" >> "$CALL_LOG"
  case "$1" in
    container) [ "$EXISTING" = true ] ;;
    stop|rename) [ "$FAILURE" != "$1" ] ;;
    start) [ "$RESTART_FAILS" = false ] ;;
    *) return 99 ;;
  esac
}
'''
        with tempfile.TemporaryDirectory() as directory:
            log = Path(directory) / "calls"
            env = dict(os.environ, CALL_LOG=str(log), FAILURE=failure,
                       EXISTING=str(existing).lower(),
                       RESTART_FAILS=str(restart_fails).lower())
            result = subprocess.run(
                ["sh", "-c", mock + handoff + 'printf "prepared=%s\\n" "$had_previous"'],
                env=env, capture_output=True, text=True,
            )
            return result, log.read_text().splitlines()

    def test_success_preserves_backup(self):
        result, calls = self.run_handoff()
        self.assertEqual(result.returncode, 0)
        self.assertIn("prepared=true", result.stdout)
        self.assertEqual(calls[-2:], ["stop waps-server", "rename waps-server waps-server-previous"])

    def test_first_deployment_does_not_stop_anything(self):
        result, calls = self.run_handoff(existing=False)
        self.assertEqual(result.returncode, 0)
        self.assertIn("prepared=false", result.stdout)
        self.assertEqual(calls, ["container inspect waps-server"])

    def test_rename_failure_restarts_original(self):
        result, calls = self.run_handoff(failure="rename")
        self.assertEqual(result.returncode, 1)
        self.assertEqual(calls[-1], "start waps-server")
        self.assertNotIn("prepared=", result.stdout)

    def test_stop_failure_restarts_without_renaming(self):
        result, calls = self.run_handoff(failure="stop")
        self.assertEqual(result.returncode, 1)
        self.assertEqual(calls[-2:], ["stop waps-server", "start waps-server"])

    def test_restart_failure_reports_manual_recovery(self):
        result, calls = self.run_handoff(failure="rename", restart_fails=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("manual recovery required", result.stderr)
        self.assertEqual(calls[-1], "start waps-server")


if __name__ == "__main__":
    unittest.main()
