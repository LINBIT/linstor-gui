# Changelog

# 1.8.1 - 2024-09-13

Fixed

- "Not enabled" error in certain cases
- Instructions for installing the LINSTOR GUI on a LINSTOR controller node
- Dependency vulnerabilities

# 1.8.0 - 2024-09-12

Changed

- LINSTOR GUI is now officially open source starting with this release

# 1.7.7 - 2024-09-05

Fixed

- VSAN link error on the error report page
- Select and delete error on the Storage Pool page
- Style issues on the resource group page
- Key-value store initialization error for GUI settings
- Grafana dashboard routing and link error

Added

- CI pipeline on GitLab
- SOS report download
- Create/edit passphrase

Changed

- Only admin users can access the settings page and the users page
- Renamed “Dashboard” to “Grafana Dashboard” on the settings page
- Textual changes on the Storage Pool page

# 1.7.6 - 2024-08-26

Fixed

- Field errors and validation in the resource creation form
- Resource form entry click behavior

Added

- Unlock LINSTOR passphrase from settings page
- Support for creating storage pools on different nodes simultaneously
- check node status(DISKLESS or not) before creating a resource snapshot

Changed

- Changed the behavior when clicking on the LINSTOR remote backup

# 1.7.5 - 2024-08-12

### Fixed

- add user click area

### Added

- support for managing remotes and backups
- links between pages
- view network usage information on node detail page
- add support for NFS xfs backend for VSAN mode and gateway mode

### Changed

- edit internal props on controller page & the UI for entering edit mode

# 1.7.4 - 2024-07-22

### Fixed

- dashboard charts display error
- node deletion and lost errors

### Added

- create Volume Definition
- edit prop on controller page

### Changed

- notification list filter

# 1.7.3 - 2024-07-09

### Fixed

- user authentication initialization error
- controller edit form initial value display error

# 1.7.2 - 2024-07-05

### Fixed

- style issue on user page
- export path for NSF target
- bulk deletion status error
- auto_evict_allow_eviction tip error
- dropdown menu vibrates

### Added

- controller page
- multi service IP addresses for iSCSI target creation

### Changed

- limit the number of NFS targets to 1 and support multiple volumes
- colors for pie chart and bar chart

# 1.7.1 - 2024-06-17

### Fixed

- gateway menu is not shown when gateway is enabled
- export path for NSF target
- bulk deletion error for resource/rg/vd
- iscsi list error in some cases

### Added

- resource connection status
- multi service IP addresses for iSCSI target creation
- gateway add volume error
- user authentication readonly for non-admin users

### Changed

- user authentication is shown by default
- the UI for gateway target

# 1.7.0 - 2024-06-03

### Fixed

- the amount of volume on dashboard is not correct
- update dependencies and fix security vulnerabilities

### Added

- new charts for nodes, resources and volumes
- search query for nodes, storage pools, resource groups, volumes, volume definitions, snapshots, error reports
- sync query string with URL
- volume definition page
- volume number on volume list page

### Changed

- new forms for creating and editing resources
- new chats for node detail page
- move ip address management to node detail page
- UI for uploading custom logo

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
