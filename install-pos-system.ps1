#requires -RunAsAdministrator
# One installer. Run in an Administrator PowerShell, from the folder containing pos-system.ps1:
#   powershell -ExecutionPolicy Bypass -File .\install-pos-system.ps1
# Optional: add -AsCurrentUser to run the tasks as your Windows user (asks for your password).
param([switch]$AsCurrentUser)

$Dir    = "C:\pos-system"
$Script = Join-Path $Dir "pos-system.ps1"
New-Item -ItemType Directory -Force -Path $Dir | Out-Null
Copy-Item (Join-Path $PSScriptRoot "pos-system.ps1") $Script -Force

# find PM2 and its data folder
$pm2 = (Get-Command pm2.cmd -ErrorAction SilentlyContinue).Source
if (-not $pm2) { $pm2 = (Get-Command pm2 -ErrorAction SilentlyContinue).Source }
if (-not $pm2) { throw "PM2 not found. Install it first:  npm install -g pm2" }
$pm2Home = if ($env:PM2_HOME) { $env:PM2_HOME } else { Join-Path $env:USERPROFILE ".pm2" }
Write-Host "PM2:      $pm2"
Write-Host "PM2 home: $pm2Home"

function New-PosAction([string]$mode) {
  New-ScheduledTaskAction -Execute "powershell.exe" -Argument ("-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Script`" -Mode $mode -Pm2Cmd `"$pm2`" -Pm2Home `"$pm2Home`"")
}

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 1)

if ($AsCurrentUser) {
  $cred  = Get-Credential "$env:USERDOMAIN\$env:USERNAME" -Message "Windows password for the scheduled tasks"
  $plain = $cred.GetNetworkCredential().Password
} else {
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
}

function Register-PosTask([string]$name, $trigger, [string]$mode) {
  $action = New-PosAction $mode
  if ($AsCurrentUser) {
    Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings `
      -User $cred.UserName -Password $plain -RunLevel Highest -Force | Out-Null
  } else {
    Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings `
      -Principal $principal -Force | Out-Null
  }
  Write-Host "Registered task: $name"
}

# 1. at every boot (30 s delay so Windows services settle)
$boot = New-ScheduledTaskTrigger -AtStartup
$boot.Delay = "PT30S"
Register-PosTask "POS Startup" $boot "Startup"

# 2. health check every minute
$every = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 3650)
Register-PosTask "POS Watchdog" $every "Watchdog"

# 3. daily backup at 23:30
$daily = New-ScheduledTaskTrigger -Daily -At "17:00"
Register-PosTask "POS Mongo Backup" $daily "Backup"

Write-Host ""
Write-Host "Installed. Next:"
Write-Host "  1. Edit settings in $Script (AppDir, MongoUri, CopyDir ...)"
Write-Host "  2. Run 'pm2 save' once, after your app is running"
Write-Host "  3. Test:  schtasks /Run /TN `"POS Startup`"   then read $Dir\system.log"
