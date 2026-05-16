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
	"sync"
	"time"
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

	autoOpen := shouldOpenBrowser(*noOpen)
	lifecycle := newAppLifecycle(autoOpen)
	handler := spaHandler{fsys: dist, lifecycle: lifecycle}
	listener, selectedPort, err := listenForApp(*host, *port, !explicitPort)
	if err != nil {
		log.Fatal(err)
	}
	url := fmt.Sprintf("http://%s:%d/", *host, selectedPort)
	server := &http.Server{Handler: handler}
	if autoOpen {
		lifecycle.startMonitor(func() {
			log.Print("browser heartbeat stopped; shutting down UPS-LEIPS Analyzer")
			if err := server.Close(); err != nil {
				log.Printf("failed to close server: %v", err)
			}
		})
	}
	log.Printf("UPS-LEIPS Analyzer listening on %s", url)
	if autoOpen {
		openBrowser(url)
	}
	err = server.Serve(listener)
	if err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
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
	fsys      fs.FS
	lifecycle *appLifecycle
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h.lifecycle != nil && h.lifecycle.serveHeartbeat(w, r) {
		return
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cleanPath := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
	if cleanPath == "." || cleanPath == "" {
		cleanPath = "index.html"
	}

	if cleanPath == "index.html" {
		h.serveIndex(w, r)
		return
	}

	if fileExists(h.fsys, cleanPath) {
		http.FileServer(http.FS(h.fsys)).ServeHTTP(w, r)
		return
	}

	h.serveIndex(w, r)
}

func (h spaHandler) serveIndex(w http.ResponseWriter, r *http.Request) {
	index, err := fs.ReadFile(h.fsys, "index.html")
	if err != nil {
		http.Error(w, "index.html not found", http.StatusInternalServerError)
		return
	}
	if h.lifecycle != nil {
		index = h.lifecycle.injectHeartbeatScript(index)
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	if r.Method == http.MethodHead {
		return
	}
	_, _ = w.Write(index)
}

func fileExists(fsys fs.FS, name string) bool {
	info, err := fs.Stat(fsys, name)
	return err == nil && !info.IsDir()
}

const heartbeatPath = "/__ups_leips/heartbeat"

type appLifecycle struct {
	enabled bool
	mu      sync.Mutex
	seen    bool
	last    time.Time
}

func newAppLifecycle(enabled bool) *appLifecycle {
	return &appLifecycle{
		enabled: enabled,
		last:    time.Now(),
	}
}

func (l *appLifecycle) serveHeartbeat(w http.ResponseWriter, r *http.Request) bool {
	if !l.enabled || r.URL.Path != heartbeatPath {
		return false
	}
	if r.Method != http.MethodGet && r.Method != http.MethodPost && r.Method != http.MethodHead {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return true
	}
	l.mu.Lock()
	l.seen = true
	l.last = time.Now()
	l.mu.Unlock()
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
	return true
}

func (l *appLifecycle) injectHeartbeatScript(index []byte) []byte {
	if !l.enabled {
		return index
	}
	script := `<script>
(() => {
  const ping = () => fetch("/__ups_leips/heartbeat", { method: "POST", cache: "no-store", keepalive: true }).catch(() => {});
  ping();
  setInterval(ping, 3000);
})();
</script>`
	html := string(index)
	if strings.Contains(html, "</body>") {
		return []byte(strings.Replace(html, "</body>", script+"</body>", 1))
	}
	return []byte(html + script)
}

func (l *appLifecycle) startMonitor(shutdown func()) {
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for now := range ticker.C {
			if l.expired(now) {
				shutdown()
				return
			}
		}
	}()
}

func (l *appLifecycle) expired(now time.Time) bool {
	if !l.enabled {
		return false
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	timeout := 60 * time.Second
	if l.seen {
		timeout = 15 * time.Second
	}
	return now.Sub(l.last) > timeout
}
