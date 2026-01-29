package main

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Println("domain,hasMX,hasSPF,spfRecord,hasDMARC,dmarcRecord")

	for scanner.Scan() {
		domain := strings.TrimSpace(strings.ToLower(scanner.Text()))
		if domain == "" {
			continue
		}
		checkDomain(domain)
	}

	if err := scanner.Err(); err != nil {
		log.Fatal("Error reading input:", err)
	}
}

func checkDomain(domain string) {
	var hasMX, hasSPF, hasDMARC bool
	var spfRecord, dmarcRecord string

	// Basic domain validation
	if !strings.Contains(domain, ".") {
		fmt.Printf("%q,%t,%t,%q,%t,%q\n", domain, false, false, "", false, "")
		return
	}

	// MX records
	mxRecords, err := net.LookupMX(domain)
	if err == nil && len(mxRecords) > 0 {
		hasMX = true
	}

	// SPF records
	txtRecords, err := net.LookupTXT(domain)
	if err == nil {
		for _, record := range txtRecords {
			if strings.HasPrefix(record, "v=spf1") {
				hasSPF = true
				spfRecord = record
				break
			}
		}
	}

	// DMARC records
	dmarcRecords, err := net.LookupTXT("_dmarc." + domain)
	if err == nil {
		for _, record := range dmarcRecords {
			if strings.HasPrefix(record, "v=DMARC1") {
				hasDMARC = true
				dmarcRecord = record
				break
			}
		}
	}

	fmt.Printf("%q,%t,%t,%q,%t,%q\n", domain, hasMX, hasSPF, spfRecord, hasDMARC, dmarcRecord)
}
