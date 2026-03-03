package main

import (
	"fmt"
	"log"
)

func main() {
	fmt.Println("Hello, World!")

	if err := run(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}

func run() error {
	return nil
}
