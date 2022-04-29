# Hypedia
Hybrid Platform Encyclopedia for Question Answering

## Setup

### Git
1. Clone this repository and install npm dependencies
  ```
  git clone TODO
  cd hypedia
  npm install
  ```

### Azure Console
1. Follow the setup guide for creating a question answering cognitive service resource: https://docs.microsoft.com/en-us/azure/cognitive-services/language-service/question-answering/how-to/manage-knowledge-base

### Debugging Environment
1. Download VSCode
2. Setup a Heroku local server
3. Add the following block to `launch.js` to configure a debugging session
  ```
  {
    "type": "node",
    "request": "attach",
    "name": "Attach to Process",
    "port": 7000
  }
  ```
