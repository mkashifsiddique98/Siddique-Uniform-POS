# POS system manager: ONE script, three jobs.
#   -Mode Startup   : at boot -> start MongoDB, start app with PM2, wait until healthy
#   -Mode Watchdog  : every minute -> check /api/health, restart app after repeated failures
#   -Mode Backup    : daily -> mongodump to dated archive, copy to 2nd location, delete old ones
# Installed by install-pos-system.ps1 (Task Scheduler). Log: C:\pos-system\system.log

param(
  [Parameter(Mandatory = $true)][ValidateSet("Startup", "Watchdog", "Backup")][string]$Mode,
  [string]$Pm2Cmd  = "pm2",   # filled in by the installer
  [string]$Pm2Home = ""       # filled in by the installer
)

# ======================= SETTINGS (edit these) =======================
$AppName      = "pos-uniform"                    # PM2 process name (ecosystem.config.js)
$AppDir       = "C:\path\to\your\project"        # folder that contains ecosystem.config.js
$HealthUrl    = "http://localhost:3000/api/health"
$MongoService = "MongoDB"                        # Windows service name of MongoDB
$MongoPort    = 27017
$MaxFailures  = 3                                # failed health checks before restart

$MongoUri     = "mongodb://127.0.0.1:27017/YOUR_DB_NAME"
$MongoDump    = "C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe"
$BackupDir    = "C:\pos-backups"
$CopyDir      = "D:\pos-backups"                 # 2nd location: other disk / external drive
$KeepDays     = 14
# =====================================================================

$Dir         = "C:\pos-system"
$LogFile     = Join-Path $Dir "system.log"
$FailFile    = Join-Path $Dir "failures.txt"
$StartupLock = Join-Path $Dir "startup.lock"
New-Item -ItemType Directory -Force -Path $Dir | Out-Null

if ($Pm2Home) { $env:PM2_HOME = $Pm2Home }
$env:Path += ";C:\Program Files\nodejs"

function Log($msg) {
  Add-Content -Path $LogFile -Value ("{0}  [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Mode, $msg)
  if ((Get-Item $LogFile).Length -gt 2MB) { Get-Content $LogFile -Tail 2000 | Set-Content $LogFile }
}

function Test-Port([int]$port) {
  try {
    $c = New-Object Net.Sockets.TcpClient
    $r = $c.BeginConnect("127.0.0.1", $port, $null, $null)
    $ok = $r.AsyncWaitHandle.WaitOne(1000)
    if ($ok) { $c.EndConnect($r) }
    $c.Close()
    return $ok
  } catch { return $false }
}

function Ensure-Mongo {
  $svc = Get-Service -Name $MongoService -ErrorAction SilentlyContinue
  if ($svc -and $svc.Status -ne "Running") {
    Log "MongoDB service not running, starting it"
    Start-Service -Name $MongoService -ErrorAction SilentlyContinue
  }
  for ($i = 0; $i -lt 24; $i++) {          # wait up to ~2 minutes
    if (Test-Port $MongoPort) { return $true }
    Start-Sleep -Seconds 5
  }
  return $false
}

function Test-Health {
  try {
    $r = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 10
    return @{ ok = ($r.StatusCode -eq 200); reason = "HTTP $($r.StatusCode)" }
  } catch {
    return @{ ok = $false; reason = $_.Exception.Message }
  }
}

function Start-App([bool]$restart) {
  Set-Location $AppDir
  if ($restart) {
    & $Pm2Cmd describe $AppName *> $null
    if ($LASTEXITCODE -eq 0) { & $Pm2Cmd restart $AppName *> $null; return }
  }
  & $Pm2Cmd resurrect *> $null              # same as your old bat file
  Start-Sleep -Seconds 5
  & $Pm2Cmd describe $AppName *> $null
  if ($LASTEXITCODE -ne 0) {                # nothing saved -> start from config
    Log "Nothing to resurrect, starting from ecosystem.config.js"
    & $Pm2Cmd start ecosystem.config.js *> $null
    & $Pm2Cmd save *> $null
  }
}

switch ($Mode) {

  "Startup" {
    Set-Content $StartupLock (Get-Date).ToString("o")      # tells the watchdog to wait
    Log "Startup begin"
    if (-not (Ensure-Mongo)) { Log "WARNING: MongoDB port not reachable after 2 min (app will keep retrying)" }
    Start-App $false

    $healthy = $false
    for ($i = 0; $i -lt 24; $i++) {                         # wait up to ~2 minutes
      Start-Sleep -Seconds 5
      if ((Test-Health).ok) { $healthy = $true; break }
    }
    if ($healthy) { Log "Startup complete, app healthy" } else { Log "WARNING: app not healthy after startup, watchdog will handle it" }
    Set-Content $FailFile 0
    Remove-Item $StartupLock -Force -ErrorAction SilentlyContinue
  }

  "Watchdog" {
    if (Test-Path $StartupLock) {                           # skip while startup is running
      if (((Get-Date) - (Get-Item $StartupLock).LastWriteTime).TotalMinutes -lt 5) { exit 0 }
      Remove-Item $StartupLock -Force -ErrorAction SilentlyContinue
    }

    $failures = 0
    if (Test-Path $FailFile) { $failures = [int](Get-Content $FailFile) }

    $h = Test-Health
    if ($h.ok) {
      if ($failures -gt 0) { Log "RECOVERED after $failures failed check(s)" }
      Set-Content $FailFile 0
      exit 0
    }

    $failures++
    Set-Content $FailFile $failures
    Log "FAIL ($failures/$MaxFailures): $($h.reason)"

    if (-not (Test-Port $MongoPort)) {                      # database down: try to start it
      Log "MongoDB port closed, trying to start service"
      Start-Service -Name $MongoService -ErrorAction SilentlyContinue
    }

    if ($failures -ge $MaxFailures) {
      Log "Restarting $AppName"
      Start-App $true
      Set-Content $FailFile 0
    }
  }

  "Backup" {
    if (-not (Test-Path $MongoDump)) {
      $cmd = Get-Command mongodump -ErrorAction SilentlyContinue
      if ($cmd) { $MongoDump = $cmd.Source } else { Log "ERROR: mongodump not found"; exit 1 }
    }
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    $Archive = Join-Path $BackupDir ("pos-{0}.archive.gz" -f (Get-Date -Format "yyyy-MM-dd_HH-mm"))

    Log "Backup starting -> $Archive"
    & $MongoDump --uri="$MongoUri" --archive="$Archive" --gzip 2>> $LogFile

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $Archive) -or (Get-Item $Archive).Length -lt 1KB) {
      Log "ERROR: backup FAILED (exit code $LASTEXITCODE)"
      if (Test-Path $Archive) { Remove-Item $Archive -Force }
      exit 1
    }
    Log ("Backup OK ({0} MB)" -f [math]::Round((Get-Item $Archive).Length / 1MB, 2))

    try {
      New-Item -ItemType Directory -Force -Path $CopyDir | Out-Null
      Copy-Item $Archive $CopyDir -Force
      Log "Copied to $CopyDir"
    } catch { Log "WARNING: copy to $CopyDir failed: $($_.Exception.Message)" }

    foreach ($d in @($BackupDir, $CopyDir)) {
      if (Test-Path $d) {
        Get-ChildItem $d -Filter "pos-*.archive.gz" |
          Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
          ForEach-Object { Remove-Item $_.FullName -Force; Log "Deleted old backup $($_.Name)" }
      }
    }
  }
}
