// import { readFileSync, writeFileSync } from 'fs';
// import { parseDocument } from 'yaml';

// // Read the YAML file
// const filePath = 'yaml-test.yml';
// const fileContent = readFileSync(filePath, 'utf8');

// // Parse the YAML file while preserving comments and formatting
// const doc = parseDocument(fileContent);

// // Function to modify a property in the AST
// const modifyProperty = (node, keyPath, newValue) => {
//     const keys = keyPath.split('.'); // Split the keyPath into individual keys
//     let currentNode = node;

//     for (const key of keys) {
//         if (currentNode.type === 'MAP') {
//             const pair = currentNode.get(key); // Get the specific key
//             if (pair) {
//                 currentNode = pair.value; // Move to the next node
//             } else {
//                 return false; // Key not found
//             }
//         } else {
//             return false; // Not in a map
//         }
//     }

//     currentNode.value = newValue; // Change the value
//     return true; // Property found and modified
// };

// // Modify the 'name' property inside the 'app' object
// modifyProperty(doc.contents, 'app.name', 'NewWebApp');

// // Stringify the YAML back to a string while preserving original formatting
// const newYaml = doc.toString({lineWidth: 9000, minContentWidth: 0});

// // Write the modified YAML back to the file
// writeFileSync("yaml-test2.yml", newYaml);

// import YAWN from 'yawn-yaml';
// import { readFileSync, writeFileSync } from 'fs';
// import { parseDocument, Document, isPair, isMap, isSeq, isScalar } from 'yaml';
// import { createNode } from 'yaml/util';

// // Read the YAML file
// const filePath = 'yaml-test.yml';
// const fileContent = readFileSync(filePath, 'utf8');

// // Parse the YAML file while preserving comments and formatting
// const doc = parseDocument(fileContent);

// // Function to set a property on a given object
// const setProperty = (targetObject, propertyName, value) => {
//     // targetObject.type === 'MAP'
//     if (isMap(targetObject)) {
//         const pair = targetObject.get(propertyName);
//         if (pair) {
//             // pair.value = targetObject.createNode(value); // Update existing value
//             targetObject.set(propertyName, value);
//         } else {
//             // Create new key-value pair
//             const newKeyNode = value;//{ key: propertyName, value };
//             targetObject.set(propertyName, newKeyNode);
//         }
//     }
// };

// const setArrayElement = (targetObject, idx, value) => {

//     if (isSeq(targetObject) && targetObject.items.length >= idx){
//         const node = targetObject.get(idx);
//         if (isMap(node) || isScalar(node)){
//             targetObject.set(idx, value);
//         } else {
//             targetObject.set(idx, value);
//         }
//     } else {
//     }
// }

// // { port: 80, https: {
// //     enabled: true, hasValidCertificate: false, options: [
// //         "a", 1, 2, 3, "b"
// //     ]
// // }

// //  }

// // Now you can directly modify the 'server' property on 'app'
// const appNode = doc.contents.get('app').get("server"); // Get the 'app' object
// console.log(appNode);
// if (true) {
//     setProperty(appNode, 'port', 20); // Modify app.server
//     setProperty(appNode, "name", "other name");
//     setProperty(appNode, "os", "linux");
//     setProperty(appNode, "other", "value");
//     setProperty(appNode, "different", {key: 20, value: 20});
//     setArrayElement(appNode.get("names"), 2, {this:92})

// }
// // Stringify the YAML back to a string while preserving original formatting
// const newYaml = doc.toString({ lineWidth: 9000, minContentWidth: 0 });
