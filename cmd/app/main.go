package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"
)

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		log.Printf("[%s] %s %s - From: %s",
			r.Method,
			r.URL.Path,
			r.URL.RawQuery,
			r.RemoteAddr,
		)

		next.ServeHTTP(w, r)

		log.Printf("[%s] %s - Completed in %v",
			r.Method,
			r.URL.Path,
			time.Since(start),
		)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func trackHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[TRACK] Error reading body: %v", err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var eventData map[string]interface{}
	if err := json.Unmarshal(body, &eventData); err == nil {
		prettyJSON, _ := json.MarshalIndent(eventData, "", "  ")
		log.Printf("[TRACK] Event from %s:\n%s", r.RemoteAddr, string(prettyJSON))
	} else {
		log.Printf("[TRACK] Raw data from %s: %s", r.RemoteAddr, string(body))
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusNoContent)
}

func staticFileHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[STATIC] Serving: %s", r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/track", trackHandler)

	staticDir := http.Dir("./web/static")
	staticHandler := http.FileServer(staticDir)
	mux.Handle("/static/", staticFileHandler(http.StripPrefix("/static/", staticHandler)))

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(`Prassionate Tracking Server

Endpoints:
  POST /api/track - Submit tracking events
  GET  /static/  - Static files (tracker.js)
  GET  /health   - Health check
`))
	})

	handler := loggingMiddleware(corsMiddleware(mux))

	port := ":8080"
	server := &http.Server{
		Addr:         port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	log.Printf("Starting Prassionate server on http://localhost%s", port)
	log.Printf("Tracker: http://localhost%s/static/tracker.iife.js", port)

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
