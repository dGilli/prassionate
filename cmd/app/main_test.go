package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	req, err := http.NewRequest(http.MethodGet, "/health", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := "OK"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
}

func TestTrackHandler(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		body       interface{}
		wantStatus int
	}{
		{
			name:       "valid event",
			method:     http.MethodPost,
			body:       map[string]interface{}{"event": "pageview", "url": "http://example.com"},
			wantStatus: http.StatusNoContent,
		},
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			body:       nil,
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "valid custom event",
			method:     http.MethodPost,
			body:       map[string]interface{}{"event": "button_click", "properties": map[string]string{"button": "signup"}},
			wantStatus: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body *bytes.Reader
			if tt.body != nil {
				jsonBody, _ := json.Marshal(tt.body)
				body = bytes.NewReader(jsonBody)
			} else {
				body = bytes.NewReader([]byte{})
			}

			req, err := http.NewRequest(tt.method, "/api/track", body)
			if err != nil {
				t.Fatal(err)
			}

			rr := httptest.NewRecorder()
			trackHandler(rr, req)

			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("handler returned wrong status code: got %v want %v", status, tt.wantStatus)
			}

			// Check CORS headers for POST requests
			if tt.method == http.MethodPost && tt.wantStatus == http.StatusNoContent {
				if cors := rr.Header().Get("Access-Control-Allow-Origin"); cors != "*" {
					t.Errorf("missing or incorrect CORS header: got %v want *", cors)
				}
			}
		})
	}
}

func TestCorsMiddleware(t *testing.T) {
	handler := corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	}))

	t.Run("OPTIONS request", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodOptions, "/api/track", nil)
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
		}

		// Verify CORS headers
		if h := rr.Header().Get("Access-Control-Allow-Origin"); h != "*" {
			t.Errorf("Access-Control-Allow-Origin header not set correctly: got %v", h)
		}
		if h := rr.Header().Get("Access-Control-Allow-Methods"); !strings.Contains(h, "POST") {
			t.Errorf("Access-Control-Allow-Methods header doesn't contain POST: got %v", h)
		}
	})

	t.Run("regular request with CORS headers", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodPost, "/api/track", bytes.NewReader([]byte(`{"event":"test"}`)))
		if err != nil {
			t.Fatal(err)
		}

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		// CORS headers should be set even though it's not an OPTIONS request
		if h := rr.Header().Get("Access-Control-Allow-Origin"); h != "*" {
			t.Errorf("Access-Control-Allow-Origin header not set: got %v", h)
		}
	})
}

func TestLoggingMiddleware(t *testing.T) {
	innerHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("test response"))
	})

	handler := loggingMiddleware(innerHandler)

	req, err := http.NewRequest(http.MethodGet, "/test-path", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := "test response"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
}
