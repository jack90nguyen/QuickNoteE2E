APP_NAME   := Note E2E
BIN_NAME   := NoteE2E
CONFIG     := release
APP_DIR    := build/$(APP_NAME).app
CONTENTS   := $(APP_DIR)/Contents

ICON_SRC   := Resources/icon-source.png
ICONSET    := build/AppIcon.iconset
ICNS       := Resources/AppIcon.icns

.PHONY: all build app universal run clean icon

all: app

icon: $(ICNS)

$(ICNS): $(ICON_SRC) scripts/make-icon.swift
	@rm -rf "$(ICONSET)"
	@swift scripts/make-icon.swift "$(ICON_SRC)" "$(ICONSET)"
	@iconutil -c icns -o "$(ICNS)" "$(ICONSET)"
	@echo "Built $(ICNS)"

build:
	swift build -c $(CONFIG)

app: build $(ICNS)
	@rm -rf "$(APP_DIR)"
	@mkdir -p "$(CONTENTS)/MacOS" "$(CONTENTS)/Resources"
	@cp ".build/$(CONFIG)/$(BIN_NAME)" "$(CONTENTS)/MacOS/$(BIN_NAME)"
	@cp Resources/Info.plist "$(CONTENTS)/Info.plist"
	@cp "$(ICNS)" "$(CONTENTS)/Resources/AppIcon.icns"
	@echo "Built $(APP_DIR)"

universal: $(ICNS)
	swift build -c $(CONFIG) --arch arm64 --arch x86_64
	@rm -rf "$(APP_DIR)"
	@mkdir -p "$(CONTENTS)/MacOS" "$(CONTENTS)/Resources"
	@cp ".build/apple/Products/Release/$(BIN_NAME)" "$(CONTENTS)/MacOS/$(BIN_NAME)"
	@cp Resources/Info.plist "$(CONTENTS)/Info.plist"
	@cp "$(ICNS)" "$(CONTENTS)/Resources/AppIcon.icns"
	@echo "Built universal $(APP_DIR)"

run: app
	@open "$(APP_DIR)"

clean:
	@rm -rf .build build $(ICNS)
