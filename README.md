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
