$runId = "33688206683"
$jobs = (Invoke-RestMethod "https://api.github.com/repos/malaca7/7assistente/actions/runs/$runId/jobs").jobs
foreach ($job in $jobs) {
    Write-Host "Job: $($job.name) | Conclusion: $($job.conclusion)"
    foreach ($step in $job.steps) {
        Write-Host "  Step: $($step.name) -> $($step.conclusion) (Status: $($step.status))"
    }
}
