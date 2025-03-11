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

.PHONY: release
release: checkVERSION build
	mkdir -p /tmp/$(PROG)-$(VERSION)
	cp -r dist Makefile README.md COPYING /tmp/$(PROG)-$(VERSION)
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
