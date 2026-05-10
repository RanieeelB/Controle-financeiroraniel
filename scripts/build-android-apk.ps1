$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$defaultAndroidStudioJbr = Join-Path $env:ProgramFiles "Android\Android Studio\jbr"
$defaultAndroidSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"

if (-not $env:JAVA_HOME -and (Test-Path $defaultAndroidStudioJbr)) {
  $env:JAVA_HOME = $defaultAndroidStudioJbr
}

if (-not $env:ANDROID_HOME -and (Test-Path $defaultAndroidSdk)) {
  $env:ANDROID_HOME = $defaultAndroidSdk
}

if (-not $env:ANDROID_SDK_ROOT -and $env:ANDROID_HOME) {
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}

if (-not $env:JAVA_HOME) {
  throw "JAVA_HOME is not configured. Install Android Studio or set JAVA_HOME before building the APK."
}

if (-not $env:ANDROID_HOME) {
  throw "ANDROID_HOME is not configured. Install the Android SDK or set ANDROID_HOME before building the APK."
}

$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Set-Location $repoRoot
& npm.cmd run android:sync

Push-Location (Join-Path $repoRoot "android")
try {
  & .\gradlew.bat assembleDebug
}
finally {
  Pop-Location
}

$apkPath = Join-Path $repoRoot "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
  throw "APK build finished, but app-debug.apk was not found."
}

Write-Host "APK ready at $apkPath"
