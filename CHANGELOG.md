# Changelog

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