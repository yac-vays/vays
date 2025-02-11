# VAYS - Visual AdminInterface for YAC Servers
![Version](https://img.shields.io/github/v/tag/yac-vays/vays?logo=github&color=green&label=Version)
![Formatter](https://img.shields.io/badge/Code_Formatter-prettier-darkgreen)

This is the frontend for a Everything-As-A-Service for processes automated using Ansible and YAC.

## How to use

### Setup
Currently, the setup requires Node LTS Version Jod (currently v22.12.0).

After cloning, navigate into the directory and run 

```sh
npm ci
```

### Run the development server

Note this is for (local) development **only**, so if you are more interested into a production build, see below.

Create a directory cert and a certificate therein:

```sh
mkdir cert
cd cert

openssl req -x509 -newkey rsa:3072 -nodes -sha256 -subj '/CN=127.0.0.1' -keyout private-key.pem -out certificate.pem

cd ..
```

Then, start the development server. Currently, the development server in use is `vite`. To use it, run

```sh
npm run dev
```

and then navigate to the URL which is displayed in the terminal.


### Production
The building procedure for production currently is the following:

In case you have run in development mode before (see above), then do:

```sh
npm run clear # deletes development version of the editor
```

Proceed as follows:

```sh
npm run build
```

This will significantly reduce the size of the editor component and is strongly advised to be
used when deploying.


The files of interest are all in the `/dist` folder. You can run ngnix or whatever you like on this folder.
You may consider allowing compressed transmittion by enabling gzip (ngnix: `gzip on`).

## Running with Docker

You can do the following to run the docker image locally:

```sh
docker build --memory=2g -t vaysapp .
docker run -p 127.0.0.1:5173:80 --mount type=bind,source="$(pwd)"/config2.json,target=/usr/share/nginx/html/config.json,readonly vaysapp
```

Note that this does not use the selfsigned certificate created above. Depending on your settings at the OAuth provider, you'll likely can't use it for development. (As typically, redirect URLS are required to have the https protocol.)

## Misc notes

URL Schema:
  domain/yac-name/entity-type-name/?key=value#Page.NumEltsPerPage
  domain/yac-name/entity-type-name/create/name?view=blah




