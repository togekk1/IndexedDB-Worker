import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function compileAndUglify(): void {
  try {
    // Compile TypeScript to JavaScript
    execSync("tsc");

    // Uglify the compiled JavaScript
    execSync("uglifyjs dist/index.js -o dist/index.min.js");

    // Uglify the compiled JavaScript
    execSync("uglifyjs dist/worker.js -o dist/worker.min.js");

    console.log("Compilation and uglification completed successfully.");
  } catch (error) {
    console.error("Error occurred during compilation and uglification:", error);
  }
}

function createDistFolder(): void {
  const distFolderPath = path.join(__dirname, "dist");

  // Check if dist folder already exists
  if (!fs.existsSync(distFolderPath)) {
    // Create the dist folder
    fs.mkdirSync(distFolderPath);
  }
}

// Create dist folder
createDistFolder();

// Compile and uglify the worker.ts file
compileAndUglify();
