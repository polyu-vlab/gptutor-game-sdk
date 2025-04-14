.PHONY: build publish link unlink dev test clean

# Development commands
dev:
	pnpm run dev

test:
	pnpm run test

build:
	pnpm run build

clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf .pnpm-store

# Publishing commands
publish: build
	@./scripts/publish.sh

# Version management
version-patch:
	pnpm version patch

version-minor:
	pnpm version minor

version-major:
	pnpm version major

# Local development linking
link:
	pnpm link --global

unlink:
	pnpm unlink --global

# Help command
help:
	@echo "Available commands:"
	@echo "  make dev        - Start development server"
	@echo "  make test       - Run tests"
	@echo "  make build      - Build the package"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make publish    - Publish the package"
	@echo "  make link       - Link package for local development"
	@echo "  make unlink     - Unlink package"
	@echo "  make version-patch - Bump patch version"
	@echo "  make version-minor - Bump minor version"
	@echo "  make version-major - Bump major version" 