package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"golang.org/x/crypto/openpgp"
)

type key struct {
	Key   openpgp.Entity `json:"-"`
	KeyId string
	Name  string
	Group string
}

var (
	keys       map[string]key
	keysMu     sync.Mutex
	keyRing    openpgp.KeyRing
	addr       string
	input      string
	output     string
	eventLogMu sync.Mutex
	eventLog   []string
)

func init() {
	flag.StringVar(&addr, "addr", "127.0.0.1:8080", "address to listen on")
	flag.StringVar(&input, "input", "", "")
	flag.StringVar(&output, "output", "", "")
}

func (k key) String() string {
	return fmt.Sprintf("KeyId=%s,Name=%s,Group=%s", k.KeyId, k.Name, k.Group)
}

func getKeys(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	values := []key{}
	for _, val := range keys {
		values = append(values, val)
	}

	keysMu.Lock()
	defer keysMu.Unlock()
	if err := json.NewEncoder(w).Encode(values); err != nil {
		http.Error(w, "Error encoding response object", http.StatusInternalServerError)
	}
}

func getLog(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "text/plain")
	eventLogMu.Lock()
	for _, line := range eventLog {
		fmt.Fprintf(w, "%s\n", line)
	}
	eventLogMu.Unlock()
}

func logEvent(line string) {
	eventLogMu.Lock()
	eventLog = append(eventLog, fmt.Sprintf("%s %s", time.Now().Format(time.RFC3339), line))
	eventLogMu.Unlock()
}

func addKey(w http.ResponseWriter, r *http.Request) {
	newKey := struct {
		Key   string
		Name  string
		Group string
	}{}

	err := json.NewDecoder(r.Body).Decode(&newKey)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}
	if newKey.Key == "" || newKey.Name == "" || newKey.Group == "" {
		http.Error(w, http.StatusText(http.StatusUnprocessableEntity), http.StatusUnprocessableEntity)
		return
	}

	tmpKeyRing, err := openpgp.ReadArmoredKeyRing(strings.NewReader(newKey.Key))
	if err != nil {
		http.Error(w, http.StatusText(http.StatusUnprocessableEntity), http.StatusUnprocessableEntity)
		return
	}
	keyId := tmpKeyRing[0].PrimaryKey.KeyIdString()
	keysMu.Lock()
	keys[keyId] = key{
		Key:   *tmpKeyRing[0],
		KeyId: keyId,
		Name:  newKey.Name,
		Group: newKey.Group,
	}

	var el openpgp.EntityList
	for _, val := range keys {
		el = append(el, &val.Key)
	}
	keyRing = el
	logEvent(fmt.Sprintf("Added key: %s", keys[keyId]))
	keysMu.Unlock()
}

func deleteKey(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if _, ok := keys[vars["keyId"]]; ok {
		keysMu.Lock()
		key := keys[vars["keyId"]]
		delete(keys, vars["keyId"])
		logEvent(fmt.Sprintf("Deleted key: %s", key))
		keysMu.Unlock()

	} else {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
	}
}

func checkSignature(signedFile, signatureFile string) (*openpgp.Entity, error) {
	signed, err := os.Open(signedFile)
	if err != nil {
		return nil, err
	}
	defer signed.Close()
	signature, err := os.Open(signatureFile)
	if err != nil {
		return nil, err
	}
	defer signature.Close()

	return openpgp.CheckDetachedSignature(keyRing, signed, signature)
}

func mover() {
	log.Print("Starting mover")
	for {
		if keyRing == nil {
			log.Print("Keyring not yet initialized")
			time.Sleep(2 * time.Second)
			continue
		}

		files, err := ioutil.ReadDir(input)
		if err != nil {
			log.Fatal(err)
		}

		signedFiles := make(map[string][]string, 0)
		for _, file := range files {
			if file.Mode().IsRegular() && strings.HasSuffix(file.Name(), ".sig") {
				log.Print("Found signature file: " + file.Name())
				signedFile := strings.TrimSuffix(file.Name(), ".sig")
				index := strings.LastIndex(signedFile, ".")
				if index > 0 {
					signedFile = signedFile[:index]
				}
				if _, err := os.Stat(fmt.Sprintf("%s/%s", input, signedFile)); err != nil {
					log.Print(fmt.Sprintf("Couldn't find file %s for signature %s", signedFile, file.Name()))
					continue
				}
				if _, ok := signedFiles[signedFile]; ok {
					signedFiles[signedFile] = append(signedFiles[signedFile], file.Name())
				} else {
					signedFiles[signedFile] = []string{file.Name()}
				}
			}
		}

		for file, signatures := range signedFiles {
			groups := []string{}
			signedBy := []key{}

			for _, sig := range signatures {
				sig = fmt.Sprintf("%s/%s", input, sig)
				entity, err := checkSignature(fmt.Sprintf("%s/%s", input, file), sig)
				if err != nil {
					log.Print("Error checking signature " + err.Error())
					continue
				}
				keyId := entity.PrimaryKey.KeyIdString()
				signedBy = append(signedBy, keys[keyId])
				group := keys[keyId].Group
				add := true
				for _, g := range groups {
					if g == group {
						add = false
					}
				}
				if add {
					groups = append(groups, group)
				}
			}
			if len(groups) > 1 {
				log.Println(fmt.Sprintf("%s signed by two groups, moving...", file))
				os.Rename(fmt.Sprintf("%s/%s", input, file), fmt.Sprintf("%s/%s", output, file))
				for _, file := range signatures {
					os.Rename(fmt.Sprintf("%s/%s", input, file), fmt.Sprintf("%s/%s", output, file))
				}
				logEvent(fmt.Sprintf("Moved file %s signed by %v", file, signedBy))
			}
		}
		time.Sleep(2 * time.Second)
	}
}

func main() {
	flag.Parse()
	keys = make(map[string]key)

	go mover()

	r := mux.NewRouter()
	r.HandleFunc("/keys", getKeys).Methods("GET")
	r.HandleFunc("/keys/log", getLog).Methods("GET")
	r.HandleFunc("/keys", addKey).Methods("POST")
	r.HandleFunc("/keys/{keyId}", deleteKey).Methods("DELETE")
	log.Print("Listening on " + addr)
	log.Fatal(http.ListenAndServe(addr, handlers.CORS(handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "DELETE"}), handlers.AllowedHeaders([]string{"Content-Type"}))(r)))
}
