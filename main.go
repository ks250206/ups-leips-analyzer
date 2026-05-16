package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os/exec"
	"path"
	"runtime"
	"strings"
)

//go:embed dist/*
var embeddedDist embed.FS

func main() {
	host := flag.String("host", "127.0.0.1", "host to bind")
	port := flag.Int("port", 4173, "port to bind")
	noOpen := flag.Bool("no-open", false, "do not open the default browser")
	flag.Parse()
	explicitPort := false
	flag.Visit(func(f *flag.Flag) {
		if f.Name == "port" {
			explicitPort = true
		}
	})

	dist, err := fs.Sub(embeddedDist, "dist")
	if err != nil {
		log.Fatalf("failed to open embedded dist: %v", err)
	}

	handler := spaHandler{fsys: dist}
	listener, selectedPort, err := listenForApp(*host, *port, !explicitPort)
	if err != nil {
		log.Fatal(err)
	}
	url := fmt.Sprintf("http://%s:%d/", *host, selectedPort)
	log.Printf("UPS-LEIPS Analyzer listening on %s", url)
	if shouldOpenBrowser(*noOpen) {
		openBrowser(url)
	}
	log.Fatal(http.Serve(listener, handler))
}

func listenForApp(host string, port int, allowFallback bool) (net.Listener, int, error) {
	for candidate := port; candidate < port+100; candidate++ {
		listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", host, candidate))
		if err == nil {
			return listener, candidate, nil
		}
		if !allowFallback {
			return nil, port, err
		}
	}
	return nil, port, fmt.Errorf("no available port found from %d to %d", port, port+99)
}

func shouldOpenBrowser(noOpen bool) bool {
	return runtime.GOOS == "darwin" && !noOpen
}

func openBrowser(url string) {
	if err := exec.Command("open", url).Start(); err != nil {
		log.Printf("failed to open browser: %v", err)
	}
}

type spaHandler struct {
	fsys fs.FS
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cleanPath := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
	if cleanPath == "." || cleanPath == "" {
		cleanPath = "index.html"
	}

	if fileExists(h.fsys, cleanPath) {
		http.FileServer(http.FS(h.fsys)).ServeHTTP(w, r)
		return
	}

	r.URL.Path = "/index.html"
	http.FileServer(http.FS(h.fsys)).ServeHTTP(w, r)
}

func fileExists(fsys fs.FS, name string) bool {
	info, err := fs.Stat(fsys, name)
	return err == nil && !info.IsDir()
}
