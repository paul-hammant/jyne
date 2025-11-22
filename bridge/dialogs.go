package main

import (
	"fmt"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

func (b *Bridge) handleShowInfo(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	title := msg.Payload["title"].(string)
	message := msg.Payload["message"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowInformation(title, message, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowError(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	_ = msg.Payload["title"].(string) // title is not used by ShowError, but keep for API compatibility
	message := msg.Payload["message"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowError(fmt.Errorf("%s", message), win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowConfirm(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	title := msg.Payload["title"].(string)
	message := msg.Payload["message"].(string)
	callbackID := msg.Payload["callbackId"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowConfirm(title, message, func(confirmed bool) {
		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{"callbackId": callbackID, "confirmed": confirmed},
		})
	}, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowFileOpen(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	callbackID := msg.Payload["callbackId"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowFileOpen(func(reader fyne.URIReadCloser, err error) {
		var filePath string
		if reader != nil {
			filePath = reader.URI().Path()
			reader.Close()
		}

		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{
				"callbackId": callbackID,
				"filePath":   filePath,
				"error":      err != nil,
			},
		})
	}, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowFileSave(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	callbackID := msg.Payload["callbackId"].(string)
	fileName, _ := msg.Payload["fileName"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowFileSave(func(writer fyne.URIWriteCloser, err error) {
		var filePath string
		if writer != nil {
			filePath = writer.URI().Path()
			writer.Close()
		}

		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{
				"callbackId": callbackID,
				"filePath":   filePath,
				"error":      err != nil,
			},
		})
	}, win)

	// Set default filename if provided
	if fileName != "" {
		// Note: Fyne doesn't have a direct API to set default filename in ShowFileSave
		// This would need to be enhanced with NewFileSave and SetFileName
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowFolderOpen(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	callbackID := msg.Payload["callbackId"].(string)

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	dialog.ShowFolderOpen(func(uri fyne.ListableURI, err error) {
		var folderPath string
		if uri != nil {
			folderPath = uri.Path()
		}

		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{
				"callbackId": callbackID,
				"folderPath": folderPath,
				"error":      err != nil,
			},
		})
	}, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowForm(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	title := msg.Payload["title"].(string)
	confirmText := msg.Payload["confirmText"].(string)
	dismissText := msg.Payload["dismissText"].(string)
	callbackID := msg.Payload["callbackId"].(string)
	fieldsRaw := msg.Payload["fields"].([]interface{})

	b.mu.RLock()
	win, exists := b.windows[windowID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	// Create form items and track entries for value retrieval
	formItems := make([]*widget.FormItem, 0, len(fieldsRaw))
	entryWidgets := make(map[string]fyne.CanvasObject)

	for _, fieldRaw := range fieldsRaw {
		field := fieldRaw.(map[string]interface{})
		fieldName := field["name"].(string)
		fieldLabel := field["label"].(string)
		fieldType, _ := field["type"].(string)
		if fieldType == "" {
			fieldType = "entry" // default to text entry
		}
		placeholder, _ := field["placeholder"].(string)
		initialValue, _ := field["value"].(string)
		hintText, _ := field["hint"].(string)

		var inputWidget fyne.CanvasObject

		switch fieldType {
		case "password":
			entry := widget.NewPasswordEntry()
			entry.SetPlaceHolder(placeholder)
			entry.SetText(initialValue)
			inputWidget = entry
		case "multiline":
			entry := widget.NewMultiLineEntry()
			entry.SetPlaceHolder(placeholder)
			entry.SetText(initialValue)
			inputWidget = entry
		case "select":
			options, _ := field["options"].([]interface{})
			optionStrings := make([]string, len(options))
			for i, opt := range options {
				optionStrings[i] = opt.(string)
			}
			selectWidget := widget.NewSelect(optionStrings, nil)
			if initialValue != "" {
				selectWidget.SetSelected(initialValue)
			}
			inputWidget = selectWidget
		case "check":
			checkWidget := widget.NewCheck("", nil)
			if initialValue == "true" {
				checkWidget.SetChecked(true)
			}
			inputWidget = checkWidget
		default: // "entry" or any other
			entry := widget.NewEntry()
			entry.SetPlaceHolder(placeholder)
			entry.SetText(initialValue)
			inputWidget = entry
		}

		entryWidgets[fieldName] = inputWidget

		formItem := widget.NewFormItem(fieldLabel, inputWidget)
		if hintText != "" {
			formItem.HintText = hintText
		}
		formItems = append(formItems, formItem)
	}

	// Show the form dialog
	dialog.ShowForm(title, confirmText, dismissText, formItems, func(submitted bool) {
		// Collect values from all fields
		values := make(map[string]interface{})

		if submitted {
			for name, w := range entryWidgets {
				switch typedWidget := w.(type) {
				case *widget.Entry:
					values[name] = typedWidget.Text
				case *widget.Select:
					values[name] = typedWidget.Selected
				case *widget.Check:
					values[name] = typedWidget.Checked
				}
			}
		}

		b.sendEvent(Event{
			Type: "callback",
			Data: map[string]interface{}{
				"callbackId": callbackID,
				"submitted":  submitted,
				"values":     values,
			},
		})
	}, win)

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}
