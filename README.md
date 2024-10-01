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

This package does not have a standalone server; it requires the LINSTOR environment and serves files through the LINSTOR server. It should be installed on the machine running the LINSTOR controller. After installation, it can be accessed via a URL like `http://192.168.123.105:3370/ui/#!/`, replacing `192.168.123.105` with the IP address of your LINSTOR controller. Please choose your own Linux distribution, for Ubuntu and Debian:

```
apt add-apt-repository ppa:linbit/linbit-drbd9-stack
apt install linstor-gui
```

### Running in a Docker container

```bash
export DOCKER_BUILDKIT=1

# docker-compose build
docker build --no-cache \
             --build-arg="LINSTOR_GUI_VERSION=v1.8.1" \
             --tag linstor-gui .

# docker-compose up
docker run \
  -p 8080:8080 \
  -e LB_LINSTOR_API_HOST=http://192.168.123.105:3370 \
  -e LB_GATEWAY_API_HOST=http://192.168.123.105:8080 \
  linstor-gui
```

* Optionnal add HTTPS support

```bash
$ mkdir -p volumes/ssl

# create autosigned cert
$ openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
              -keyout ./volumes/ssl/linstor-gui.key \
              -out ./volumes/ssl/linstor-gui.crt

# create diffie hellman
$ openssl dhparam -out ./volumes/ssl/dh.pem 2048
```

```diff
--- docker-compose.yml.old
+++ docker-compose.yml
...
    environment:
    ...
+     - EXTERNAL_HTTPS_PORT=443 #default 8443
    ports:
      - "80:8080"
+     - "443:8443"
+   volumes:
+     - ./volumes/ssl:/opt/ssl:ro
...
```

LB_LINSTOR_API_HOST is required, LB_GATEWAY_API_HOST is optional, default is `http://localhost:8080`.

### Running development mode on local machine(for developers)

- `npm install`
- Create a `.env` file in the root directory with the following variables:

```
# The hostname or IP address running the `linstor-gui` (optional)
HOST=127.0.0.1
# The port of the `linstor-gui` (optional)
PORT=8080
# The version of the `linstor-gui` (optional)
VERSION=DEV
# The host of the LINSTOR API
LINSTOR_API_HOST=http://192.168.123.214:3370
# The host of the LINSTOR GATEWAY API (optional)
GATEWAY_API_HOST=http://192.168.123.214:8080
# The host of the LINBIT VSAN API (optional)
VSAN_API_HOST=https://192.168.123.214
```

- `npm run start:dev`,
- Open your browser and navigate to `http://localhost:8080`

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
