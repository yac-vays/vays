# Updating packages

To update packages, execute the following:

```sh

npm update --save
npm update --save-dev
```


Do not execute using `--save --save-dev`, because this includes some packages in the devDependency
section in package.json.