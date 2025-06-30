# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2025-06-30

### Changed

- Switched to npm package manager
- Removed yarn.lock file (no longer needed with npm)

## [1.0.6] - 2025-06-27

### Changed

- Improved build script logic with cross-platform compatibility (macOS/Linux)
- Enhanced file modification time checking with platform-specific stat commands
- Optimized build detection to iterate through files more efficiently

## [1.0.5] - 2025-06-27

### Changed

- Bumped dependencies to latest versions

## [1.0.4] - 2025-06-26

### Changed

- Update kucoin-api dependency to 1.0.4 with broker partner header condition fix (check secrets existence)
- Fixed broker partner header condition to check for secrets existence

## [1.0.3] - 2025-06-25

- Added .eslintcache to .gitignore (maintenance).
