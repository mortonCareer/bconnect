const { openApiToBruno, yamlToJson } = require('@usebruno/converters');
const { readFile, writeFile } = require('fs/promises');

async function testOpenApiConversion(yamlFile, outputFile) {
const yamlContent = await readFile(yamlFile, 'utf8');
const jsonSpec = yamlToJson(yamlContent);
if (jsonSpec) {
  try {
    const brunoCollection = openApiToBruno(jsonSpec);
    await writeFile(outputFile, JSON.stringify(brunoCollection, null, 2));
    console.log('Full conversion pipeline successful!');
  } catch (error) {
    console.error('Bruno conversion error:', error.message);
  }
}
}

testOpenApiConversion('./openapi.yaml', './bruno-collection.json');