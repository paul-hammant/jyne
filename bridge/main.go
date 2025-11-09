package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"
)

// Message types for communication
type Message struct {
	ID      string                 `json:"id"`
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}

type Response struct {
	ID      string                 `json:"id"`
	Success bool                   `json:"success"`
	Result  map[string]interface{} `json:"result,omitempty"`
	Error   string                 `json:"error,omitempty"`
}

type Event struct {
	Type     string                 `json:"type"`
	WidgetID string                 `json:"widgetId"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

// Bridge manages the Fyne app and communication
type Bridge struct {
	app       fyne.App
	windows   map[string]fyne.Window
	widgets   map[string]fyne.CanvasObject
	callbacks map[string]string // widget ID -> callback ID
	mu        sync.RWMutex
	writer    *json.Encoder
}

func NewBridge() *Bridge {
	return &Bridge{
		app:       app.New(),
		windows:   make(map[string]fyne.Window),
		widgets:   make(map[string]fyne.CanvasObject),
		callbacks: make(map[string]string),
		writer:    json.NewEncoder(os.Stdout),
	}
}

func (b *Bridge) sendEvent(event Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if err := b.writer.Encode(event); err != nil {
		log.Printf("Error sending event: %v", err)
	}
}

func (b *Bridge) sendResponse(resp Response) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if err := b.writer.Encode(resp); err != nil {
		log.Printf("Error sending response: %v", err)
	}
}

func (b *Bridge) handleMessage(msg Message) {
	switch msg.Type {
	case "createWindow":
		b.handleCreateWindow(msg)
	case "setContent":
		b.handleSetContent(msg)
	case "showWindow":
		b.handleShowWindow(msg)
	case "createButton":
		b.handleCreateButton(msg)
	case "createLabel":
		b.handleCreateLabel(msg)
	case "createEntry":
		b.handleCreateEntry(msg)
	case "createVBox":
		b.handleCreateVBox(msg)
	case "createHBox":
		b.handleCreateHBox(msg)
	case "setText":
		b.handleSetText(msg)
	case "getText":
		b.handleGetText(msg)
	case "quit":
		b.handleQuit(msg)
	default:
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   fmt.Sprintf("Unknown message type: %s", msg.Type),
		})
	}
}

func (b *Bridge) handleCreateWindow(msg Message) {
	title := msg.Payload["title"].(string)
	windowID := msg.Payload["id"].(string)

	win := b.app.NewWindow(title)

	b.mu.Lock()
	b.windows[windowID] = win
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"windowId": windowID},
	})
}

func (b *Bridge) handleSetContent(msg Message) {
	windowID := msg.Payload["windowId"].(string)
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	win, winExists := b.windows[windowID]
	widget, widgetExists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !winExists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Window not found",
		})
		return
	}

	if !widgetExists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	win.SetContent(widget)
	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleShowWindow(msg Message) {
	windowID := msg.Payload["windowId"].(string)

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

	win.Show()
	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleCreateButton(msg Message) {
	widgetID := msg.Payload["id"].(string)
	text := msg.Payload["text"].(string)
	callbackID, hasCallback := msg.Payload["callbackId"].(string)

	btn := widget.NewButton(text, func() {
		if hasCallback {
			b.sendEvent(Event{
				Type:     "callback",
				WidgetID: widgetID,
				Data:     map[string]interface{}{"callbackId": callbackID},
			})
		}
	})

	b.mu.Lock()
	b.widgets[widgetID] = btn
	if hasCallback {
		b.callbacks[widgetID] = callbackID
	}
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateLabel(msg Message) {
	widgetID := msg.Payload["id"].(string)
	text := msg.Payload["text"].(string)

	lbl := widget.NewLabel(text)

	b.mu.Lock()
	b.widgets[widgetID] = lbl
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateEntry(msg Message) {
	widgetID := msg.Payload["id"].(string)
	placeholder, _ := msg.Payload["placeholder"].(string)

	entry := widget.NewEntry()
	entry.SetPlaceHolder(placeholder)

	b.mu.Lock()
	b.widgets[widgetID] = entry
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateVBox(msg Message) {
	widgetID := msg.Payload["id"].(string)
	childIDs, _ := msg.Payload["children"].([]interface{})

	var children []fyne.CanvasObject
	b.mu.RLock()
	for _, childID := range childIDs {
		if child, exists := b.widgets[childID.(string)]; exists {
			children = append(children, child)
		}
	}
	b.mu.RUnlock()

	vbox := container.NewVBox(children...)

	b.mu.Lock()
	b.widgets[widgetID] = vbox
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleCreateHBox(msg Message) {
	widgetID := msg.Payload["id"].(string)
	childIDs, _ := msg.Payload["children"].([]interface{})

	var children []fyne.CanvasObject
	b.mu.RLock()
	for _, childID := range childIDs {
		if child, exists := b.widgets[childID.(string)]; exists {
			children = append(children, child)
		}
	}
	b.mu.RUnlock()

	hbox := container.NewHBox(children...)

	b.mu.Lock()
	b.widgets[widgetID] = hbox
	b.mu.Unlock()

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"widgetId": widgetID},
	})
}

func (b *Bridge) handleSetText(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)
	text := msg.Payload["text"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	switch w := widget.(type) {
	case *widget.Label:
		w.SetText(text)
	case *widget.Entry:
		w.SetText(text)
	case *widget.Button:
		w.SetText(text)
	default:
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget does not support setText",
		})
		return
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
}

func (b *Bridge) handleGetText(msg Message) {
	widgetID := msg.Payload["widgetId"].(string)

	b.mu.RLock()
	widget, exists := b.widgets[widgetID]
	b.mu.RUnlock()

	if !exists {
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget not found",
		})
		return
	}

	var text string
	switch w := widget.(type) {
	case *widget.Label:
		text = w.Text
	case *widget.Entry:
		text = w.Text
	case *widget.Button:
		text = w.Text
	default:
		b.sendResponse(Response{
			ID:      msg.ID,
			Success: false,
			Error:   "Widget does not support getText",
		})
		return
	}

	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
		Result:  map[string]interface{}{"text": text},
	})
}

func (b *Bridge) handleQuit(msg Message) {
	b.sendResponse(Response{
		ID:      msg.ID,
		Success: true,
	})
	b.app.Quit()
}

func main() {
	bridge := NewBridge()

	// Read messages from stdin in a goroutine
	go func() {
		scanner := bufio.NewScanner(os.Stdin)
		for scanner.Scan() {
			line := scanner.Text()
			var msg Message
			if err := json.Unmarshal([]byte(line), &msg); err != nil {
				log.Printf("Error parsing message: %v", err)
				continue
			}
			bridge.handleMessage(msg)
		}
	}()

	// Run the Fyne app (blocks until quit)
	bridge.app.Run()
}
