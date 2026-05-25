#!/usr/bin/env swift
import Cocoa

guard CommandLine.arguments.count == 3 else {
    fputs("usage: make-icon.swift <source.png> <iconset-dir>\n", stderr)
    exit(1)
}

let srcPath = CommandLine.arguments[1]
let dstDir = CommandLine.arguments[2]

guard let sourceImage = NSImage(contentsOfFile: srcPath) else {
    fputs("error: cannot load \(srcPath)\n", stderr)
    exit(1)
}

let sizes: [(Int, String)] = [
    (16,   "icon_16x16.png"),
    (32,   "icon_16x16@2x.png"),
    (32,   "icon_32x32.png"),
    (64,   "icon_32x32@2x.png"),
    (128,  "icon_128x128.png"),
    (256,  "icon_128x128@2x.png"),
    (256,  "icon_256x256.png"),
    (512,  "icon_256x256@2x.png"),
    (512,  "icon_512x512.png"),
    (1024, "icon_512x512@2x.png"),
]

try? FileManager.default.createDirectory(atPath: dstDir, withIntermediateDirectories: true)

let radiusRatio: CGFloat = 0.2237

for (size, name) in sizes {
    let dim = CGFloat(size)
    let radius = dim * radiusRatio

    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ) else { continue }

    rep.size = NSSize(width: dim, height: dim)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

    let rect = NSRect(x: 0, y: 0, width: dim, height: dim)
    NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).addClip()

    sourceImage.draw(in: rect,
                     from: .zero,
                     operation: .copy,
                     fraction: 1.0,
                     respectFlipped: true,
                     hints: [.interpolation: NSImageInterpolation.high.rawValue])

    NSGraphicsContext.restoreGraphicsState()

    guard let data = rep.representation(using: .png, properties: [:]) else { continue }
    let outPath = "\(dstDir)/\(name)"
    try data.write(to: URL(fileURLWithPath: outPath))
    print("✓ \(outPath) (\(size)px)")
}
