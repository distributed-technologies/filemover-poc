# filemover-poc

This is a PoC of a filemover which can move files between two directories, if the files have been signed by two people in different groups.

## Usage

```sh
$ go build
$ mkdir input output
$ ./filemover-poc -addr 127.0.0.1:8080 -input input -output output
```

### Get keys

```sh
$ curl -s 127.0.0.1:8080/keys | jq .
[
  {
    "KeyId": "61B7B526D98F0353",
    "Name": "John Doe",
    "Group": "Employe"
  }
]
```

### Eventlog

```sh
$ curl http://127.0.0.1:8080/keys/log
2021-12-15T14:58:15+01:00 Added key: KeyId=61B7B526D98F0353,Name=John Doe,Group=Employe
2021-12-15T14:58:36+01:00 Moved file Hello.txt signed by [KeyId=61B7B526D98F0353,Name=John Doe,Group=Employe KeyId=xx,Name=xx,Group=xx]
2021-12-15T15:02:40+01:00 Deleted key: KeyId=61B7B526D98F0353,Name=John Doe,Group=Employe
```

### Add key

```sh
$ curl -O https://archive.mozilla.org/pub/firefox/releases/89.0/KEY
$ jq --arg key "$(<KEY)" --arg name "John Doe" --arg group "Employe" '{"Key": $key, "Name": $name, "Group": $group}' -n > data.json
$ curl --data "$(<data.json)" 127.0.0.1:8080/keys
```

### Delete key

```sh
$ curl -X DELETE 127.0.0.1:8080/keys/61B7B526D98F0353
```
