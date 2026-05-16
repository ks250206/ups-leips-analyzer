package main

import (
	"net"
	"testing"
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
