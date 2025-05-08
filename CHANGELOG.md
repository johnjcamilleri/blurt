# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Pick function
- Keyboard shortcuts

### Changed

### Deprecated

### Removed

### Fixed

### Security

---

## [1.1.0] - 2025-04-24

### Added

- Off mode
- Icons in teacher view
- Pause/resume function
- Normalise whitespace in responses

### Changed

- Folder structure in client
- Use Alpine store instead of data (teacher view)

### Removed

- Small QR code

### Fixed

- Show/hide button
- Rendering bug

## [1.0.0] - 2025-04-11

Initial release & world premiere at Chalmers FP talk!

- Backend server with Express and Socket.IO.
- Client-side Alpine.js state management for teacher and student views.
- Endpoints:
  - `/new` for generating room names.
  - `/join/:room` for joining existing room.
  - `/:room` for creating named room.
- Free-text and yes/no/maybe modes.
- Hide and clear buttons in teacher view.
- QR code generation for student view URLs.
- Backend testsuite and client simulation script.
