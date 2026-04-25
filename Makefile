TAURI_TARGET ?= x86_64-pc-windows-gnu
BUNDLE_DIR := src-tauri/target/$(TAURI_TARGET)/release/bundle
RELEASE_EXE := src-tauri/target/$(TAURI_TARGET)/release/app.exe
PACKAGE_DIR ?= artifacts/release
POWERSHELL := powershell.exe -NoProfile -ExecutionPolicy Bypass -Command

.PHONY: help install build lint test smoke tauri-check verify package-exe collect-package package-clean exe-path open-dist clean

help:
	@$(POWERSHELL) "Write-Host 'Agent DesktopPet packaging targets:'; Write-Host '  make package-exe     Build Windows bundles and collect release artifacts'; Write-Host '  make collect-package Copy generated exe/msi files into $(PACKAGE_DIR)'; Write-Host '  make verify          Run lint, tests, smoke check, and cargo check'; Write-Host '  make exe-path        Print generated executable/installers'; Write-Host '  make open-dist       Open the collected package output directory'; Write-Host '  make clean           Remove frontend dist, Tauri bundle, and package output'"

install:
	npm install

build:
	npm run build

lint:
	npm run lint

test:
	npm run test:run

smoke:
	npm run smoke:check

tauri-check:
	cargo check --manifest-path src-tauri/Cargo.toml --target $(TAURI_TARGET)

verify: lint test smoke tauri-check

package-exe: package-clean
	npm exec tauri -- build --target $(TAURI_TARGET)
	@$(MAKE) collect-package
	@$(MAKE) exe-path

collect-package:
	@$(POWERSHELL) "New-Item -ItemType Directory -Force '$(PACKAGE_DIR)' | Out-Null; if (Test-Path '$(RELEASE_EXE)') { Copy-Item -LiteralPath '$(RELEASE_EXE)' -Destination '$(PACKAGE_DIR)/desktoppet-app.exe' -Force } else { Write-Error 'Release executable not found: $(RELEASE_EXE)' }; if (Test-Path '$(BUNDLE_DIR)') { Get-ChildItem -Path '$(BUNDLE_DIR)' -Recurse -Filter '*.exe' -File -ErrorAction SilentlyContinue | Copy-Item -Destination '$(PACKAGE_DIR)' -Force; Get-ChildItem -Path '$(BUNDLE_DIR)' -Recurse -Filter '*.msi' -File -ErrorAction SilentlyContinue | Copy-Item -Destination '$(PACKAGE_DIR)' -Force } else { Write-Error 'Bundle directory not found: $(BUNDLE_DIR)' }; Write-Host 'Collected package artifacts in $(PACKAGE_DIR)'"

package-clean:
	@$(POWERSHELL) "Remove-Item -LiteralPath '$(PACKAGE_DIR)' -Recurse -Force -ErrorAction SilentlyContinue; New-Item -ItemType Directory -Force '$(PACKAGE_DIR)' | Out-Null"

exe-path:
	@$(POWERSHELL) "Write-Host 'Collected package artifacts:'; if (Test-Path '$(PACKAGE_DIR)') { Get-ChildItem -Path '$(PACKAGE_DIR)' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Format-List FullName,Length,LastWriteTime } else { Write-Host '  $(PACKAGE_DIR) not found yet' }; Write-Host ''; Write-Host 'Release executable:'; if (Test-Path '$(RELEASE_EXE)') { Get-Item '$(RELEASE_EXE)' | Format-List FullName,Length,LastWriteTime } else { Write-Host '  $(RELEASE_EXE) not found yet' }; Write-Host ''; Write-Host 'Bundled installer executables:'; if (Test-Path '$(BUNDLE_DIR)') { Get-ChildItem -Path '$(BUNDLE_DIR)' -Recurse -Filter '*.exe' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Format-List FullName,Length,LastWriteTime } else { Write-Host '  $(BUNDLE_DIR) not found yet' }; Write-Host ''; Write-Host 'Bundled MSI installers:'; if (Test-Path '$(BUNDLE_DIR)') { Get-ChildItem -Path '$(BUNDLE_DIR)' -Recurse -Filter '*.msi' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Format-List FullName,Length,LastWriteTime }"

open-dist:
	@$(POWERSHELL) "if (Test-Path '$(PACKAGE_DIR)') { Invoke-Item '$(PACKAGE_DIR)' } else { Write-Error 'Package directory not found. Run make package-exe first.' }"

clean:
	@$(POWERSHELL) "Remove-Item -LiteralPath 'dist' -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -LiteralPath '$(BUNDLE_DIR)' -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -LiteralPath '$(PACKAGE_DIR)' -Recurse -Force -ErrorAction SilentlyContinue; Write-Host 'Removed dist, $(BUNDLE_DIR), and $(PACKAGE_DIR)'"
