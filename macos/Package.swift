// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "NoteE2E",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "NoteE2E",
            path: "Sources/NoteE2E"
        )
    ]
)
