# Totally Trustworthy S3 Browser<SUP>TM</SUP> <img src="src/renderer/assets/pinky-promise-outline-sm.png" alt="You can trust me. Pinky Promise!" width="30" align=""/>

A cross-platform desktop application for browsing and managing AWS S3 buckets with an intuitive file explorer interface.

### Does this sound fun?

> "Hey look! A free S3 Browser made by a no-name company nobody at the BBB recognizes!! Sweet!"
> 
> ---- 30 minutes later ----
> 
> "Hey Look! SOMEHOW my AWS keys were stolen, my account hijacked, and customer data encrypted & exfiltrated to China. Jeepers me!"


Yeah, that doesn't sound good to me either. Yet, I loath trying to find a file in S3 through the AWS web console or CLI. Why _isn't_ there a trustworthy OSS option?

Well thanks to Claude, now there is.  The first pass of this took roughly 2 or 3 distracted hours telling my buddy Claudius what I wanted and what to change. And it friggin works! 🎉

## Disclaimers

1. ~~I do not plan to provide binary builds. That defeats the principle of not putting your most sensitive keys into software you can't introspect. If you can't build this on your own, maybe you shouldn't be using Github?~~ **Update:** I've decided to provide binary builds after all, to make this easier to distribute to our employees and contractors. CI now publishes Windows, Linux, and macOS artifacts on every release tag (and pushes the Linux build to the Snap Store).

   **But you should STILL build from scratch.** Seriously. This is your most sensitive cloud keys we're talking about — this is serious stuff, people. Do you actually know me? Am I a naughty person? Is every one of my dependencies uncompromised? You can't answer "yes" to all three, and neither can I. A binary is a black box. The source is not. If you can read code, read it, then build it yourself. The binaries exist for convenience, **not** as a substitute for due diligence.
2.  Use this at your own risk. I do.
3. Since this was kind of lark, I don't have a roadmap but you can certainly raise an issue, fork, or PR if you find a bug, want to totally steal my AI generated code, or add and improvement.

## Features

- 🔐 **AWS Profile Support**: Read and use profiles from `~/.aws/credentials` and `~/.aws/config`
- 🌍 **Multi-Region**: Select any AWS region with profile defaults
- 📦 **Bucket Browsing**: List and navigate all accessible S3 buckets with search/filter
- 📁 **Folder Navigation**: Browse S3 keys as a hierarchical folder structure
- 📂 **Create Folders**: Create new folders/prefixes in S3
- 📥 **Download Files**: Download files from S3 to local filesystem
- 📤 **Upload Files**: Upload single or multiple files via dialog or drag-and-drop
- 🗑️ **Delete Objects**: Delete files and folders (recursive deletion for folders)
- 👁️ **Preview Files**: Download and open files with default system application
- 📋 **Copy S3 Paths**: Copy S3 URIs (s3://bucket/key) to clipboard
- 🔍 **Filter Files**: Real-time search/filter for files and folders
- 🎨 **File Type Icons**: VSCode-style icons for 60+ file types
- 🧭 **Breadcrumb Navigation**: Easy navigation through folder hierarchy

## Tech Stack

- **Electron**: Cross-platform desktop application framework
- **Vue 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe development
- **Element Plus**: Vue 3 UI component library
- **Iconify**: Universal icon framework with VSCode Icons
- **AWS SDK v3**: Official AWS SDK for JavaScript
- **Vite**: Fast build tool and development server

## Prerequisites

- Node.js 18+ and npm
- AWS credentials configured in `~/.aws/credentials`
- AWS config (optional) in `~/.aws/config` for default regions

## Installation

```bash
npm install
```

## Development

Run the application in development mode:

```bash
npm run dev
```

This will start Vite dev server and launch Electron with hot-reload enabled.

## Building

Build the application for your platform:

```bash
npm run build
```

Build outputs will be in the `release/` directory.

### Platform-Specific Builds

The build system uses electron-builder and supports:

- **macOS**: DMG and ZIP
- **Windows**: NSIS installer and portable executable
- **Linux**: AppImage, DEB, and Snap packages

## Project Structure

```
s3browser/
├── src/
│   ├── main/                # Electron main process
│   │   ├── services/        # AWS and file system services
│   │   │   ├── AwsProfileReader.ts
│   │   │   ├── S3Service.ts
│   │   │   └── RegionService.ts
│   │   ├── ipc/             # IPC handlers
│   │   └── main.ts          # Entry point
│   ├── renderer/            # Vue 3 application
│   │   ├── components/      # Vue components
│   │   │   ├── ProfileSelector.vue
│   │   │   ├── RegionSelector.vue
│   │   │   ├── BucketList.vue
│   │   │   └── S3Explorer.vue
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.vue          # Root component
│   │   └── main.ts          # Vue entry point
│   ├── preload/             # Electron preload script
│   │   └── preload.ts
│   └── shared/              # Shared types and utilities
│       └── types.ts
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Usage

### Basic Navigation

1. **Select Profile**: Choose an AWS profile from the dropdown
2. **Select Region**: Choose an AWS region (defaults to profile's configured region)
3. **Browse Buckets**: Click on a bucket in the left sidebar to view its contents
4. **Filter Buckets**: Use the search box to filter buckets by name
5. **Navigate Folders**: Click on folders to drill down, use breadcrumbs to navigate up
6. **Filter Files**: Use the search box to filter files and folders in real-time

### File Operations

- **Download**: Click the download icon next to any file to save it locally
- **Preview**: Click the preview icon to download and open files with your default application
- **Upload**: Click the "Upload" button or drag-and-drop files into the file list
- **Copy Path**: Click the copy icon to copy the S3 URI (s3://bucket/key) to clipboard
- **Delete**: Click the delete icon to remove files or folders (with confirmation)

### Folder Operations

- **Create Folder**: Click the "New Folder" button to create a new folder/prefix
- **Delete Folder**: Click the delete icon on any folder to recursively delete all contents

## Security

- AWS credentials remain in the Electron main process and are never exposed to the renderer
- Uses Electron's `contextBridge` for secure IPC communication
- All S3 operations are validated before execution

## License

MIT

## Development Notes

- The application uses AWS SDK v3 with credential providers
- Profile parsing supports both `[profile name]` and `[default]` syntax
- S3 prefixes are treated as folders using the delimiter `/`
- Folders are created by uploading empty objects with trailing `/`
- Folder deletion recursively deletes all objects with that prefix
- Drag-and-drop uses Electron's `webUtils.getPathForFile()` API
- File type icons are provided by Iconify with VSCode Icons collection
- File transfers show error messages for failed operations
- All operations include confirmation dialogs and user feedback
