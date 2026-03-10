# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-11

### Updated

- Custom Inspector extensions and services for:
  - `Import GLB`
  - `Graphics Budget`
  - `Dispose By Type [Experimental]`
  - `Capture Toolbar`
  - `Vertex Tree Map`
  - `Reflection Probes`
  - `Memory Counter`
  - `BabylonPress Logo`
  - `Inspector v2 Custom Extensions Info`
- Dedicated `Import GLB` right-side pane

### Added

- Inspector-native teaching moments for supported pane and toolbar entries
- Project documentation in `README.md`, including:
  - setup instructions
  - extension installation flow
  - how to use these extensions in another Inspector integration

### Changed

- Upgraded Babylon packages to `8.54.1`
- Updated Inspector integration for current Babylon Inspector APIs
- Improved `ProbeService` row layout and selection behavior
- Simplified mesh and material display rows to reduce duplicated labels
- Fixed probe mesh re-add behavior after removal
- Improved `Import GLB` styling to better match Inspector UI
- Replaced placeholder symbols and arrows with Inspector-style icons in `Import GLB`
- Added Inspector-styled `Open Readme` action and documentation section in `Info` pane
- Added native teaching-moment triggers from the `Info` pane for entries with real Inspector anchors
- Moved the draw-call indicator to the left side of the right footer group

### Fixed

- `Import GLB` pane state now persists when switching tabs
- Clone and instance transforms now preserve root orientation more reliably
- `Info` pane text and row styling now better match Inspector conventions
- Removed broken bullet text and cleaned tooltip/help behavior
- Adjusted `Dispose By Type` styling to better fit Inspector presentation
