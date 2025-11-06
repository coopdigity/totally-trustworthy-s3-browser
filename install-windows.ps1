# Install script for Windows
# Run with: .\install-windows.ps1

Write-Host "Building Totally Trustworthy S3 Browser..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build complete! Looking for Windows installer..." -ForegroundColor Green

# Find the portable exe (easier than installer for personal use)
$portableExe = Get-ChildItem -Path "release" -Filter "*.exe" -Recurse |
    Where-Object { $_.Name -notlike "*Setup*" -and $_.Name -notlike "*Installer*" } |
    Select-Object -First 1

if (-not $portableExe) {
    Write-Host "Error: No portable executable found in release directory" -ForegroundColor Red
    Write-Host "Looking for any .exe files..." -ForegroundColor Yellow
    Get-ChildItem -Path "release" -Filter "*.exe" -Recurse | Format-Table Name, DirectoryName
    exit 1
}

Write-Host "Found: $($portableExe.FullName)" -ForegroundColor Green

# Create %LOCALAPPDATA%\Programs if it doesn't exist
$installDir = "$env:LOCALAPPDATA\Programs"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Copy the executable
$targetPath = "$installDir\s3browser.exe"
Copy-Item $portableExe.FullName -Destination $targetPath -Force
Write-Host "Copied to: $targetPath" -ForegroundColor Green

# Add to PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    Write-Host ""
    Write-Host "Adding $installDir to user PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$userPath;$installDir",
        "User"
    )
    Write-Host "PATH updated! You may need to restart your terminal." -ForegroundColor Green
} else {
    Write-Host "$installDir is already in PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Successfully installed to $targetPath" -ForegroundColor Green
Write-Host ""
Write-Host "To run the application:" -ForegroundColor Cyan
Write-Host "  1. Restart your terminal (or run: refreshenv if using Chocolatey)" -ForegroundColor White
Write-Host "  2. Type: s3browser" -ForegroundColor White
Write-Host ""
Write-Host "Or run directly: & '$targetPath'" -ForegroundColor Cyan
