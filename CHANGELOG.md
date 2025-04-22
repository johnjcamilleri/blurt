# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Off mode

### Changed

- Folder structure in client

### Deprecated

### Removed

- Remove small QR code

### Fixed

- Fix show/hide button.

### Security

---

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
