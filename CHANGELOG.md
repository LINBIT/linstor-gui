# Changelog

# 1.6.4 - 2024-05-28

### Fixed

- Enable authentication error

# 1.6.3 - 2024-05-24

### Fixed

- VSAN Mode Input validation message for nqn
- VSAN Mode Issue with the unit of size input for "Grow" in certain cases
- VSAN Mode Retrieving the list again after "Grow" operation

# 1.6.2 - 2024-05-17

### Fixed

- VSAN Mode iSCSI target validation to identify and report errors more accurately
- VSAN Mode improved handling of fetching the updated list after creating or deleting entries

# 1.6.1 - 2024-04-24

### Fixed

- VSAN target creation error
- icons for VSAN Mode menu

# 1.6.0 - 2024-03-25

### Fixed

- Resolved persistence issue with side bar menu status.
- Addressed error occurring during gateway targets creation.

### Changed

- Separated VSAN mode from LINSTOR GUI for enhanced clarity and usability.

### Added

- Storage pool list with advanced search functionality.
- Enable/disable user authentication directly via the GUI.

# 1.5.3 - 2024-02-28

### Fixed

- no notifications when creating snapshot
- cannot enter VSAN mode error from URL

### Added

- added back to list on node detail page and error report detail page
- added node name / exception type fields on error report list page
- added sort by time, filter by controller/satellite type

# 1.5.2 - 2024-02-22

### Fixed

- resolved an issue with the node detail page displaying errors
- error report pagination issue
- wrong error number in about modal
- new version cache issue

### Added

- added the ability to view storage pool and resource information for individual nodes
- implemented the ability to search error reports by node
- introduced the functionality to search error reports within a specific time range

# 1.5.1 - 2024-02-01

### Fixed

- disable select volume since we don't not support delete the volume
- default credentials for user authentication
- fetch node list error on VSAN mode
- cannot add node after exiting VSAN mode

# 1.5.1~rc.1 - 2024-01-10

### Added

- exit VSAN mode on settings pages only if the VSAN mode is enabled
- migrate resource from one node to another
- no need to clear cache when update to latest version

### Fixed

- VSAN Mode node list ip error

## 1.5.0 - 2023-11-23

### Added

- VSAN Mode
- Add title for dashboard settings fields

### Fixed

- Massive toasts for creating snapshots
- Fix displaying settings value back
- Change "Nodes" to "Node" on creating storage pool
