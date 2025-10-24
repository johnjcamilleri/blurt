# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add light theme
- Add multiple choice modes with 2-5 options

### Changed

### Deprecated

### Removed

### Fixed

### Security

---

## [1.5.3] - 2025-10-10

### Fixed

- z-index of messages

## [1.5.2] - 2025-09-27

### Added

- Add participant count to QR view
- Indicate keyboard shortcuts with underline, in button titles

### Fixed

- Clearing of buttons in mobile browsers

## [1.5.1] - 2025-09-10

### Added

- Add quick start guide

## [1.5.0] - 2025-09-10

### Changed

- Rooms are now only created via the `/create` paths; `/:room` will only join existing rooms

## [1.4.2] - 2025-09-09

### Added

- Add privacy policy

### Changed

- Make server log messages consistent

## [1.4.1] - 2025-08-30

### Added

- Optionally show response counts & percentages

### Changed

- Do no autocapitalize text responses
- Hiding responses still shows boxes, with ellipsis

### Fixed

- Improve responsiveness of navbar
- Automatically unpick on clear/mode change
- Avoid messages overlapping QR code/URL
- Recompute badge sizes on window resize

## [1.4.0] - 2025-06-17

### Added

- Play notification sound when picked
- Add number mode

### Changed

- Show icon instead of "waiting"
- Vary background opacity by hashing response

### Fixed

- Collapse menu buttons more aggressively
- Unpick on clear

## [1.3.0] - 2025-05-14

### Added

- Zen mode to completely hide controls in teacher view

### Changed

- Move link to usage guide

## [1.2.2] - 2025-05-13

### Changed

- Minor UI adjustments

## [1.2.1] - 2025-05-09

### Changed

- Change keyboard shortcuts
- Animate changes in response size

## [1.2.0] - 2025-05-08

### Added

- Pick function
- Keyboard shortcuts

### Fixed

- Redraw QR code and responses on window resize

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
