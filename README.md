# LINSTOR GUI

[![Open Source](https://img.shields.io/badge/Open-Source-brightgreen)](https://opensource.org/) [![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-brightgreen.svg)](https://opensource.org/licenses/) [![Active](http://img.shields.io/badge/Status-Active-green.svg)](https://linbit.com/linstor) [![GitHub Release](https://img.shields.io/github/release/linbit/linstor-gui.svg?style=flat)](https://github.com/LINBIT/linstor-gui) [![GitHub Commit](https://img.shields.io/github/commit-activity/y/linbit/linstor-gui)](https://github.com/LINBIT/linstor-gui) [![Support](https://img.shields.io/badge/-Enterprise%20Support-f78f22)](https://www.linbit.com/support/) [![Community Forum](https://img.shields.io/badge/-Community%20Forum-1d2a3a)](https://forums.linbit.com/c/linstor/6)

A web-based graphical user interface for LINBIT SDS (LINSTOR&reg;, DRBD&reg;, and related software).

## Description

`linstor-gui` is a web-based graphical user interface (GUI) for LINBIT SDS.
It provides a user-friendly way to create, manage, and monitor LINSTOR storage objects, such as storage pools, resource groups, resources, volumes, and snapshots.
`linstor-gui` communicates with the LINSTOR API to perform various operations, such as creating and deleting storage pools.
The GUI also provides a dashboard that displays information about the LINSTOR cluster, such as the status of nodes and volumes.

## Getting Started

### Installation on a LINSTOR controller node

This package does not have a standalone server; it requires the LINSTOR environment and serves files through the LINSTOR server. It should be installed on the machine running the LINSTOR controller. After installation, it can be accessed via a URL like `http://192.168.123.117:3370/ui/#!/`, replacing `192.168.123.117` with the IP address of your LINSTOR controller. Please choose your own Linux distribution, for Ubuntu and Debian:

```
sudo add-apt-repository ppa:linbit/linbit-drbd9-stack
sudo apt install linstor-gui
```

### Running in a Docker container

```
docker build -t linstor-gui .

docker run \
  -p 3373:3373 \
  -e LB_LINSTOR_API_HOST=http://192.168.123.117:3370 \
  -e LB_GATEWAY_API_HOST=http://192.168.123.117:8080 \
  linstor-gui

```

`LB_LINSTOR_API_HOST` is required, `LB_GATEWAY_API_HOST` is optional, default is `http://localhost:8080`.

### Running development mode on local machine(for developers)

- `npm install`
- Create a `.env` file in the root directory with the following variables:

```
# The hostname or IP address running the `linstor-gui` (optional)
VITE_HOST=127.0.0.1
# The port of the `linstor-gui` (optional)
VITE_PORT=3373
# The version of the `linstor-gui` (optional)
VITE_VERSION=DEV
# The host of the LINSTOR API
VITE_LINSTOR_API_HOST=http://192.168.123.214:3370
# The host of the LINSTOR GATEWAY API (optional)
VITE_GATEWAY_API_HOST=http://192.168.123.214:8080
# The host of the LINBIT VSAN API (optional)
VITE_HCI_VSAN_API_HOST=https://192.168.123.214
```

- `npm run start:dev`,
- Open your browser and navigate to `http://localhost:3373`

### Refreshing the LINSTOR API types

`src/app/apis/schema.ts` is generated from a copy of the controller's OpenAPI
spec, kept in `src/app/apis/Linstor-Linstor-<version>.yaml`. That version is the
**REST API version**, not the LINSTOR release version (REST 1.28.0 ships with
LINSTOR 1.34.x, REST 1.29.1 with 1.35.x). `GET /v1/controller/version` reports
the running controller's value as `rest_api_version`, and `MIN_API_VERSION`
gates GUI features on it.

To pick up a newer controller API:

```sh
# The spec lives in the linstor-server repo, on the release branch (not a
# feature branch, or you bake unreleased endpoints into the GUI).
cp /path/to/linstor-server/docs/rest_v1_openapi.yaml \
   src/app/apis/Linstor-Linstor-<new version>.yaml
git rm src/app/apis/Linstor-Linstor-<old version>.yaml

# Point the generator at the new file, then regenerate.
#   package.json -> scripts -> generate-api:linstor
npm run generate-api:linstor
npm run type-check
```

The v1 API only adds, so regenerating is usually clean. Removals do happen
(the Seagate EXOS and snapshot-shipping endpoints went away in LINSTOR 1.32),
so let `type-check` tell you what broke rather than assuming.

Prefer the generated types over hand-writing a response shape. Anything typed
by hand drifts silently the next time the controller changes.

## Help

To report a problem with this software or to make a feature request, open an issue within this project.
For help developing or contributing to this software, contact the author.
For support using the software, you can seek help within the [LINBIT Community Forums](https://forums.linbit.com/).
Or as a LINBIT support customer, you can open a support ticket from your LINBIT customer account.

## Authors

- [Liang Li](mailto:liang.li@linbit.com)

## Contributions

Contributions are welcome! Either raise and Github issue if you find a bug or create a pull request if you have a fix or new feature.

## License

This project is licensed under the GPL-3.0 License - see the COPYING file for details

## Acknowledgments

LINSTOR GUI is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3 of the License. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
