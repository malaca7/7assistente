$r = Invoke-RestMethod "https://api.github.com/repos/malaca7/7assistente/actions/runs/33688206683"
Write-Host "Run HTML URL:" $r.html_url
Write-Host "Run Name:" $r.name
Write-Host "Conclusion:" $r.conclusion
Write-Host "Jobs URL:" $r.jobs_url

$jobsResp = Invoke-RestMethod $r.jobs_url
Write-Host "Total Jobs:" $jobsResp.total_count
foreach ($j in $jobsResp.jobs) {
    Write-Host "Job:" $j.name "-> Conclusion:" $j.conclusion "Status:" $j.status
    foreach ($s in $j.steps) {
        Write-Host "   Step:" $s.name "-> Conclusion:" $s.conclusion "Status:" $s.status
    }
}
