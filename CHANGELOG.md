# Changelog

# 1.9.2 - 2025-03-12

### Fixed

- Display issue of SP chart on the dashboard
- Display issue of aux properties on the resource overview

### Changed

- New property editor
- Replaced webpack with Vite as the build tool
- Adjusted page layout
- Removed PatternFly and other unnecessary dependencies

# 1.9.1 - 2025-02-27

### Fixed

- Fixed faulty resource list on the dashboard page
- Fixed missing aux properties on the resource overview page
- Fixed scrollbar issue on the dashboard page

### Changed

- Use different colors for different resource types on the dashboard page

# 1.9.0 - 2025-02-25

### Added

- new dashboard with more detailed information about storage pool and resources

### Fixed

- Blank page error in VSAN mode
- Used capacity exceeds 100 on node detail page

### Changed

- Actions styled on resource overview page
- Property editor entries for RD on resource overview page

# 1.8.9 - 2025-01-07

### Added

- Pagination on the resource overview page
- Display of the storage pool name on the resource overview page

### Fixed

- 404 error when accessing the resource group creation page

### Changed

- Page layout for better scrolling
- Improved the search functionality on the resource overview page
- Updated dependencies

# 1.8.8 - 2024-12-20

### Fixed

- Corrected the display of all sizes
- Resolved issues with incorrect connections status on the resource overview page in certain cases
- Fixed the resource group filtering issue on the resource overview page

# 1.8.7 - 2024-12-18

### Added

- Added a new Resource Overview page to display resource-related information
- Service IP input validation for iSCSI and NVMe-oF
- Prompt users to change their password when using default credentials

### Fixed

- Large sizes were displayed as "Infinity PiB"

### Changed

- Updated the icon for list actions

# 1.8.6 - 2024-11-20

### Added

- Support for internationalization (partially completed)
- check mylinbit status in VSAN mode

### Changed

- description and input style for grafana dashboard settings
- clear input values when switching SP type

# 1.8.5 - 2024-11-05

### Added

- Support for adding custom columns on the resource and volume pages
- Display volume capacity on the volume page
- Support for DRBD_DISKLESS and available node check in the create resource form

### Changed

- Allow users to remove added aux columns
- Changed the storage pool to optional on the create resource page

# 1.8.4 - 2024-10-22

### Added

- Support for creating storage pools with the ZFS device provider
- Loading status for node adding

### Fixed

- Debounced request for gateway host check
- Node edit page blank error
- Capacity on Storage Pools displaying NaN in some cases
- Refetching list when a Storage Pool is created
- Support status check for open-sourced LINSTOR GUI
- Installation instructions for LINSTOR GUI on a LINSTOR controller node

### Changed

- Reduced bundle size

# 1.8.3 - 2024-10-09

### Added

- More device provider types such as ZFS for storage pool creation
- Support for remote image URLs when customizing the logo

### Fixed

- Bug causing the node list to be empty when adding or removing nodes in VSAN Mode

# 1.8.2 - 2024-09-30

Added

- Toast log for recent operations : Implemented a toast log feature to display feedback on actions like user additions and deletions.
- Advanced options for Storage Pool create form : Added advanced options including SED and VDO settings during storage pool creation.
- Detailed settings for Gateway : Added more granular configuration options for the gateway.
- Tooltips for Storage Pool form : Tooltips added to the Storage Pool form to improve usability.
- Description text for Grafana dashboard settings : Added helpful description text to the Grafana dashboard settings section.
- GitHub Workflow integration : Integrated GitHub workflows for streamlined development processes.
- NGINX server in Docker : Implemented an NGINX server within Docker to enhance deployment options.

Changed

- Gateway status check : Added a check to ensure the gateway is operational before enabling it.

Fixed

- Code and log cleanup : Removed outdated codes and logs to maintain codebase hygiene.

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
