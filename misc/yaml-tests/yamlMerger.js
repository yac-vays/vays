
import { readFileSync, writeFileSync } from 'fs';
import { parseDocument, Document, isPair, isMap, isSeq, isScalar, isNode, YAMLMap, YAMLSeq } from 'yaml';
import { createNode } from 'yaml/util';



// Read the YAML file
const filePath = 'yaml-test.yml';
const fileContent = readFileSync(filePath, 'utf8');

// Parse the YAML file while preserving comments and formatting
const doc = parseDocument(fileContent);


function mergeMap(oldObject, targetObject){
    console.log("Entry map");
    console.log(targetObject);
    for (const node of targetObject.items){
        console.log("ITERATING");
        console.log(node);
        if (oldObject.has(node.key)){
            if (isMap(node)){
                console.log("map --> MAP");
                mergeMap(oldObject.get(node.key), targetObject.get(node.key));
            } else if (isSeq(node)){
                console.log("map --> ARRAY")
                mergeArrays(oldObject.get(node.key), targetObject.get(node.key));
            } else if (isPair(node)){
                console.log("map --> pair")
                mergeMap(oldObject.get(node.key).value, targetObject.get(node.key).value)

            } else if (!isNode(node)){
                console.log("map --> no node ");
                oldObject.set(node.key, node.value);
            } else {
                console.log("map --> prop " + node.key)
                setProperty(oldObject.get(node.key), targetObject.get(node.key), node.key)
            }
        } else {
            oldObject.set(node.key, node.value);
        }
    }
}



function mergeArrays(oldObject, targetObject){
    console.log("Entry array");
    for (let i = 0; i < targetObject.items.length; i++){
        setArrayElement(oldObject, targetObject, i, i);
    }
}

// Function to set a property on a given object
const setProperty = (oldObject, targetObject, propertyName) => {
    console.log("Entry property");
    if (isMap(targetObject)) {
        console.log(oldObject)
        mergeMap(oldObject, targetObject)
        // const value = targetObject.get(propertyName);
        // if (value) {
        //     // pair.value = targetObject.createNode(value); // Update existing value
        //     oldObject.set(propertyName, value);
        // } else {
        //     // TODO
        // }
    } else if (isPair(targetObject)){
        const value = targetObject.get(propertyName);
        oldObject.set(propertyName, value);
    } else if (isScalar(targetObject)){
    } else {
        console.log(targetObject)
        console.log(isScalar(targetObject))
        console.log(isNode(targetObject))
        const value = targetObject.get(propertyName);
        oldObject.set(propertyName, value);
    }
};

const setArrayElement = (oldObject, targetObject, idxTarget, idxOld) => {
    console.log("Set array element");
    if (
        isSeq(targetObject) && targetObject.items.length >= idxTarget && 
        isSeq(oldObject) && oldObject.items.length >= idxOld
    ){
        const value = targetObject.get(idxTarget);
        if (isMap(value) || isScalar(value)){
            oldObject.set(idxOld, value);
        } else {
            // TODO:....
        }
    } 
}

// { port: 80, https: {
//     enabled: true, hasValidCertificate: false, options: [
//         "a", 1, 2, 3, "b"
//     ]
// }
    
//  }

// Now you can directly modify the 'server' property on 'app'
const appNode = doc.contents; // Get the 'app' object
let otherClone = parseDocument(fileContent);
console.log(appNode.get("app").get("server"));
// otherClone.contents?.get("app").set("name", "jkfjlkdsjfdsalkfs");
console.log(otherClone.contents.get("app").get("server"));
otherClone.contents?.get("app").get("server").set("names", [2, 3, 9, {why:28}]);
console.log(otherClone.contents.get("app").get("server"));
// console.log(appNode);
// if (true) {
//     setProperty(appNode, 'port', 20); // Modify app.server
//     setProperty(appNode, "name", "other name");
//     setProperty(appNode, "os", "linux");
//     setProperty(appNode, "other", "value");
//     setProperty(appNode, "different", {key: 20, value: 20});
//     setArrayElement(appNode.get("names"), 2, {this:92})   
// }

mergeMap(appNode, otherClone.contents);
// Stringify the YAML back to a string while preserving original formatting
const newYaml = otherClone.toString({ lineWidth: 9000, minContentWidth: 0 });

// Write the modified YAML back to the file
writeFileSync("yaml-test2.yml", newYaml);
