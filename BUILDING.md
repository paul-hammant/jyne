# Building Tsyne

## Quick Start

```bash
# Install dependencies and build everything
npm install
npm run build

# Run tests
npm test

# Or use the automated build script
./build-all-recursive.sh
```

## Prerequisites

- **Node.js** 16+ (18+ recommended)
- **Go** 1.21+
- **System libraries** (Linux):
  ```bash
  sudo apt-get install libgl1-mesa-dev xorg-dev libxrandr-dev
  ```

## Build Steps

### 1. Install Dependencies

```bash
npm install
```

This installs Node.js dependencies and attempts to build or copy the Go bridge binary (`bin/tsyne-bridge`).

### 2. Compile TypeScript

```bash
npm run build
# or
npm run build:ts
```

Creates `dist/` directory with compiled JavaScript and type definitions.

### 3. Build Go Bridge

```bash
npm run build:bridge
```

Creates `bin/tsyne-bridge` executable (~38-40 MB).

### 4. Run Tests

```bash
npm test              # All tests
npm run test:unit     # Unit tests only
```

## Automated Build

The `build-all-recursive.sh` script orchestrates everything:

```bash
# Full build + tests
./build-all-recursive.sh

# Compile only (skip tests) - fastest
./build-all-recursive.sh --skip-tests

# Verbose output
./build-all-recursive.sh --verbose

# Continue on errors
./build-all-recursive.sh --no-stop
```

## Troubleshooting

### Network-Restricted Environments (Cloud/Codespaces)

If `npm install` fails with network errors accessing `storage.googleapis.com`:

```bash
# Install system dependencies
apt-get update -qq && apt-get install -y libgl1-mesa-dev xorg-dev libxrandr-dev

# Download systray dependency manually
cd /tmp
wget -q https://github.com/fyne-io/systray/archive/refs/heads/master.tar.gz -O systray-master.tar.gz
tar -xzf systray-master.tar.gz

# Build Go bridge with local systray
cd /home/user/tsyne/bridge
go mod edit -replace=fyne.io/systray=/tmp/systray-master
env GOPROXY=direct go build -o ../bin/tsyne-bridge .

# Install npm dependencies without postinstall
cd /home/user/tsyne
npm install --ignore-scripts
```

### Go Module Proxy Issues

```bash
# Use direct fetching instead of Google's proxy
cd bridge
env GOPROXY=direct go build -o ../bin/tsyne-bridge .
```

### Tests Timeout

```bash
# Run tests individually
npx jest examples/01-hello-world.test.ts --runInBand

# Skip GUI display (headless mode is default)
npm test

# With visible GUI (requires display)
TSYNE_HEADED=1 npm test
```

## What Gets Built

| Artifact | Location | Size | Description |
|----------|----------|------|-------------|
| TypeScript output | `dist/` | ~5-10 MB | Compiled JavaScript + type definitions |
| Go bridge | `bin/tsyne-bridge` | ~38-40 MB | IPC bridge to Fyne GUI toolkit |
| Designer | `designer/dist/` | ~2-3 MB | Visual design tool (optional) |

## Environment Variables

- `TSYNE_HEADED=1` - Show GUI during tests (requires display)
- `GOPROXY=direct` - Bypass Google's Go module proxy
- `TAKE_SCREENSHOTS=1` - Capture test screenshots

## Common Commands

```bash
# Clean build
rm -rf dist/ bin/ node_modules/
npm install
npm run build

# Build specific components
npm run build:ts       # TypeScript only
npm run build:bridge   # Go bridge only

# Run specific test
npx jest examples/hello.test.ts --runInBand

# Type checking
npx tsc --noEmit

# Build designer (optional)
cd designer && npm install && npm run build
```

## Platform Notes

- **macOS**: Requires Xcode Command Line Tools
- **Linux**: Requires OpenGL and X11 development libraries (see Prerequisites)
- **Windows**: Requires MinGW-w64 for CGO

For more details, see:
- **LLM.md** - Project overview and architecture
- **docs/TESTING.md** - Testing framework guide
- **docs/ARCHITECTURE.md** - Internal architecture
