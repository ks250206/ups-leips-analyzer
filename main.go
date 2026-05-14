package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"path"
	"strings"
)

//go:embed dist/*
var embeddedDist embed.FS

func main() {
	host := flag.String("host", "127.0.0.1", "host to bind")
	port := flag.Int("port", 4173, "port to bind")
	flag.Parse()

	dist, err := fs.Sub(embeddedDist, "dist")
	if err != nil {
		log.Fatalf("failed to open embedded dist: %v", err)
	}

	handler := spaHandler{fsys: dist}
	addr := fmt.Sprintf("%s:%d", *host, *port)
	log.Printf("UPS-LEIPS Analyzer listening on http://%s/", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
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
