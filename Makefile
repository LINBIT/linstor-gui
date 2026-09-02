PROG := linstor-gui
DESTDIR =
NODEVERSION = 20

ifndef VERSION
checkVERSION:
	$(error environment variable VERSION is not set)
else
checkVERSION:
	lbvers.py check --base=$(BASE) --build=$(BUILD) --build-nr=$(BUILD_NR) --pkg-nr=$(PKG_NR) \
		--debian-changelog=debian/changelog --rpm-spec=$(PROG).spec
endif

.PHONY: .env
.env:
	echo VITE_VERSION=$(VERSION) > $@

.PHONY: build
build: deps .env ## build project
	npm run build

.PHONY: install
install: ## install files
	mkdir -p $(DESTDIR)/usr/share/linstor-server
	cp -r dist $(DESTDIR)/usr/share/linstor-server/ui

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: deps
deps: ## install dependencies
	npm install

# OCF agent catalogs. Both generators only need git + node: they parse the
# agents' meta-data XML statically, nothing is built or executed.
#
# The Windows one can use an existing checkout instead of cloning, which is
# what a build that has linstor-gui as a submodule wants:
#   make ocf-agents-windows OCF_RS_SRC=/path/to/ocf-resource-agents-rust
# or the per-agent JSON that repo's `make json-files` produces (loses
# version/unique/default, so prefer the checkout):
#   make ocf-agents-windows OCF_RS_JSON=/path/with/*.json
# OCF_RS_OUT overrides the output file; OCF_RS_FLAGS passes anything else
# through to the script.
OCF_RS_SRC =
OCF_RS_JSON =
OCF_RS_OUT =
OCF_RS_FLAGS =
OCF_LINUX_CATALOG := src/app/components/OcfAgentEditor/all_agents.ts

.PHONY: ocf-agents
ocf-agents: ## regenerate the Linux OCF agent catalog (all_agents.ts)
	npm run generate-agents

.PHONY: ocf-agents-windows
ocf-agents-windows: ## regenerate the Windows OCF agent catalog (windows_agents.ts)
	node scripts/generate-windows-agents.mjs \
		$(if $(OCF_RS_SRC),--src $(OCF_RS_SRC)) \
		$(if $(OCF_RS_JSON),--from-json $(OCF_RS_JSON)) \
		$(if $(OCF_RS_OUT),--out $(OCF_RS_OUT)) \
		$(OCF_RS_FLAGS)

# The Windows generator has a native --check; the Linux one is regenerated
# and compared with git, the same way the CI job does it.
.PHONY: ocf-agents-check
ocf-agents-check: ## verify both catalogs are up to date (Linux side regenerates in place)
	node scripts/generate-windows-agents.mjs --check $(if $(OCF_RS_SRC),--src $(OCF_RS_SRC))
	npm run generate-agents
	git diff --quiet -- $(OCF_LINUX_CATALOG) || { echo "$(OCF_LINUX_CATALOG) is out of date"; exit 1; }

.PHONY: release
release: checkVERSION build sbom/linstor-gui.cdx.json sbom/linstor-gui.spdx.json
	mkdir -p /tmp/$(PROG)-$(VERSION)
	cp -r dist Makefile README.md COPYING sbom /tmp/$(PROG)-$(VERSION)
	tar -C /tmp --owner=0 --group=0 -czvf $(PROG)-$(VERSION).tar.gz $(PROG)-$(VERSION)

.PHONY: release-docker
release-docker: checkVERSION
	tmpdir=$$(mktemp -d) && \
	docker run -it --rm -v $(PWD):/src:ro,z -v $$tmpdir:/out:z node:$(NODEVERSION) /bin/bash -c \
		'install /dev/null /usr/local/bin/lbvers.py && cd $$HOME && cp -r /src . && cd ./src && make release VERSION=$(VERSION) && cp $(PROG)-$(VERSION).tar.gz /out' && \
	mv $$tmpdir/*.tar.gz . && echo "rm -rf $$tmpdir"

.PHONY: debrelease
debrelease: checkVERSION build
	mkdir -p /tmp/$(PROG)-$(VERSION)/debian
	for f in changelog compat control copyright rules; do cp debian/$$f /tmp/$(PROG)-$(VERSION)/debian; done
	cp -r dist Makefile README.md COPYING $(PROG).spec /tmp/$(PROG)-$(VERSION)
	tar -C /tmp --owner=0 --group=0 -czvf $(PROG)-$(VERSION).tar.gz $(PROG)-$(VERSION)

.PHONY: debrelease-docker
debrelease-docker: checkVERSION ## build a release in a node container
	tmpdir=$$(mktemp -d) && \
	docker run -it --rm -v $(PWD):/src:ro,z -v $$tmpdir:/out:z node:$(NODEVERSION) /bin/bash -c \
		'install /dev/null /usr/local/bin/lbvers.py && cd $$HOME && cp -r /src . && cd ./src && make debrelease VERSION=$(VERSION) && cp $(PROG)-$(VERSION).tar.gz /out' && \
	mv $$tmpdir/*.tar.gz . && echo "rm -rf $$tmpdir"

sbom/linstor-gui.cdx.json: package.json package-lock.json
	test -d sbom || mkdir sbom
	npm sbom --sbom-format cyclonedx --sbom-type application > $@

sbom/linstor-gui.spdx.json: package.json package-lock.json
	test -d sbom || mkdir sbom
	npm sbom --sbom-format spdx --sbom-type application > $@

.PHONY: sbom
sbom: sbom/linstor-gui.cdx.json sbom/linstor-gui.spdx.json ## generate software bill of materials
