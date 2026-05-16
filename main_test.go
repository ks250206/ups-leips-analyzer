package main

import (
	"io/fs"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
	"time"
)

func TestListenForAppFallsBackFromBusyDefaultPort(t *testing.T) {
	busy, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen busy port: %v", err)
	}
	defer busy.Close()
	busyPort := busy.Addr().(*net.TCPAddr).Port

	listener, selectedPort, err := listenForApp("127.0.0.1", busyPort, true)
	if err != nil {
		t.Fatalf("listen with fallback: %v", err)
	}
	defer listener.Close()

	if selectedPort == busyPort {
		t.Fatalf("expected fallback port, got busy port %d", selectedPort)
	}
	if selectedPort != busyPort+1 {
		t.Fatalf("expected next port %d, got %d", busyPort+1, selectedPort)
	}
}

func TestListenForAppDoesNotFallbackForExplicitPort(t *testing.T) {
	busy, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen busy port: %v", err)
	}
	defer busy.Close()
	busyPort := busy.Addr().(*net.TCPAddr).Port

	listener, _, err := listenForApp("127.0.0.1", busyPort, false)
	if err == nil {
		listener.Close()
		t.Fatal("expected explicit busy port to fail")
	}
}

func TestShouldOpenBrowserHonorsNoOpenFlag(t *testing.T) {
	if shouldOpenBrowser(true) {
		t.Fatal("expected --no-open to disable browser opening")
	}
}

func TestSpaHandlerInjectsHeartbeatScriptWhenLifecycleEnabled(t *testing.T) {
	handler := spaHandler{
		fsys: fstest.MapFS{
			"index.html": {Data: []byte("<html><body><div id=\"root\"></div></body></html>")},
		},
		lifecycle: newAppLifecycle(true),
	}
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	if !strings.Contains(response.Body.String(), heartbeatPath) {
		t.Fatalf("expected heartbeat script in index html, got %q", response.Body.String())
	}
}

func TestSpaHandlerDoesNotInjectHeartbeatScriptWhenLifecycleDisabled(t *testing.T) {
	handler := spaHandler{
		fsys: fstest.MapFS{
			"index.html": {Data: []byte("<html><body><div id=\"root\"></div></body></html>")},
		},
		lifecycle: newAppLifecycle(false),
	}
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if strings.Contains(response.Body.String(), heartbeatPath) {
		t.Fatalf("did not expect heartbeat script in index html, got %q", response.Body.String())
	}
}

func TestHeartbeatEndpointUpdatesLifecycle(t *testing.T) {
	lifecycle := newAppLifecycle(true)
	handler := spaHandler{
		fsys: fstest.MapFS{
			"index.html": {Data: []byte("<html></html>")},
		},
		lifecycle: lifecycle,
	}
	request := httptest.NewRequest(http.MethodPost, heartbeatPath, nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", response.Code)
	}
	if !lifecycle.seen {
		t.Fatal("expected lifecycle to mark heartbeat as seen")
	}
}

func TestAppLifecycleExpiresAfterHeartbeatStops(t *testing.T) {
	lifecycle := newAppLifecycle(true)
	lifecycle.seen = true
	lifecycle.last = time.Now().Add(-16 * time.Second)

	if !lifecycle.expired(time.Now()) {
		t.Fatal("expected lifecycle to expire after heartbeat timeout")
	}
}

func TestSpaHandlerServesAssetsWithoutHeartbeatScript(t *testing.T) {
	handler := spaHandler{
		fsys: fstest.MapFS{
			"index.html":     {Data: []byte("<html></html>")},
			"assets/app.js":  {Data: []byte("console.log('ok');")},
			"assets/app.css": {Data: []byte("body{}")},
		},
		lifecycle: newAppLifecycle(true),
	}
	request := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	if strings.Contains(response.Body.String(), heartbeatPath) {
		t.Fatalf("did not expect heartbeat script in asset response")
	}
}

var _ fs.FS = fstest.MapFS{}
