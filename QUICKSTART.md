# Quick Start Guide - Totally Trustworthy S3 Browser 🤝

## Installation and First Run

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Electron and build tools
- Vue 3 and TypeScript
- AWS SDK v3
- Element Plus UI library
- Iconify with VSCode Icons

### 2. Run Development Server

```bash
npm run dev
```

This will:
- Start the Vite development server
- Launch the Electron application
- Enable hot-reload for quick development

### 3. First-Time Setup

When you launch the application for the first time:

1. The app will automatically read your AWS profiles from `~/.aws/credentials`
2. The first profile will be auto-selected
3. The region will default to your profile's configured region (or us-east-1)

### 4. Using the Application

**Browse Buckets:**
1. Select your AWS profile from the top-right dropdown
2. Choose your desired region
3. Your buckets will appear in the left sidebar
4. Use the filter box to search buckets by name

**Navigate Folders:**
1. Click on a bucket to view its contents
2. Click on folders (marked with yellow folder icons) to drill down
3. Use the breadcrumb navigation at the top to go back up
4. Use the filter box to search for files and folders

**Create Folders:**
1. Navigate to where you want to create a folder
2. Click the "New Folder" button
3. Enter a folder name (letters, numbers, hyphens, underscores, dots only)
4. The folder will be created as an S3 prefix

**Download Files:**
1. Click the download icon (↓) next to any file
2. Choose where to save the file
3. Wait for the success message

**Preview Files:**
1. Click the preview icon (👁️) next to any file
2. The file will download to a temp directory and open with your default application

**Upload Files:**
1. Navigate to the desired folder
2. **Option A**: Click the "Upload" button and select file(s)
3. **Option B**: Drag and drop files directly into the file list
4. Confirm the upload in the dialog
5. Files will be uploaded to the current folder

**Copy S3 Paths:**
1. Click the copy icon (📋) next to any file or folder
2. The S3 URI (s3://bucket/key) will be copied to your clipboard

**Delete Files/Folders:**
1. Click the red delete icon (🗑️) next to any file or folder
2. Confirm the deletion
3. For folders, all contents will be recursively deleted

## Troubleshooting

### "No profiles found"
- Ensure you have `~/.aws/credentials` file set up
- Check that your credentials file has the correct format:
  ```
  [default]
  aws_access_key_id = YOUR_KEY
  aws_secret_access_key = YOUR_SECRET
  ```

### "Failed to load buckets"
- Verify your AWS credentials are valid
- Check that your IAM user/role has S3 permissions
- Ensure you're selecting the correct region

### "Build failed" or TypeScript errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure you're using Node.js 18 or higher

## Building for Distribution

To create a distributable application:

```bash
npm run build
```

The built applications will be in the `release/` directory:
- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer and portable version
- **Linux**: `.AppImage`, `.deb`, and `.rpm` packages

## Tips and Features

- **File Type Icons**: The app automatically displays VSCode-style icons for 60+ file types
- **Drag Over Feedback**: When dragging files, you'll see a blue dashed border
- **Multi-File Operations**: Upload multiple files at once via dialog or drag-and-drop
- **Confirmation Dialogs**: All destructive operations (delete) require confirmation
- **Real-time Filtering**: Both bucket and file filters work in real-time as you type
- **Keyboard Navigation**: Use breadcrumbs to quickly navigate up the folder hierarchy

## Next Steps

- The application includes comprehensive error handling and user feedback
- All operations show success/error messages with details
- Loading states are displayed while fetching data
- The UI is responsive and works consistently across all platforms
- Files show proper icons based on their extension
- Folders are recursively deleted when requested

Enjoy browsing your S3 buckets with the Totally Trustworthy S3 Browser! 🤝
