const axios = require('axios').default;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser')
const fs = require('fs')

const factsFile = 'data/facts.csv';
const endpoint = 'https://hypedia.cognitiveservices.azure.com';

const confidenceScoreThreshold = 0.3;

const csvWriter = createCsvWriter({
  path: factsFile,
  header: [
    { id: 'fact', title: 'fact' },
  ],
  append: true
});

const headers = {
  'Content-Type': 'application/json',
  'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY
}

const parseFacts = async () => {
  return new Promise(resolve => {
    const results = []
    fs.createReadStream(factsFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results.map(r => r.fact).join('\n')));
  })
}

// https://docs.microsoft.com/en-us/azure/cognitive-services/language-service/question-answering/how-to/authoring#example-query
this.requestKbAnswers = async (question) => {
  const response = await axios({
    method: 'post',
    url: `${endpoint}/language/:query-knowledgebases?projectName=Hypedia&api-version=2021-10-01&deploymentName=production`,
    headers,
    data: {
      top: 3,
      question: question,
      includeUnstructuredSources: true,
      confidenceScoreThreshold,
      answerSpanRequest: {
        enable: true,
        topAnswersWithSpan: 1,
        confidenceScoreThreshold
      }
    }
  });
  const answers = response.data.answers;
  return (answers.length === 1 && answers[0].answer === 'No answer found') ? [] : answers;
}

this.requestFactAnswers = async (question) => {
  const facts = await parseFacts();

  const response = await axios({
    method: 'post',
    url: `${endpoint}/language/:query-text?api-version=2021-10-01`,
    headers,
    data: {
      question,
      records: [
        {
          id: "documentId",
          text: facts,
          language: "en"
        }
      ]
    }
  });

  return response.data.answers
    .filter(a => a.confidenceScore >= confidenceScoreThreshold)
    .map(a => {
      const span = a.answerSpan
      span.answer = span.text
      return span
    })
}

this.updateQA = async (question, answer) => {
  await axios({
    method: 'patch',
    url: `${endpoint}/language/query-knowledgebases/projects/Hypedia/qnas?api-version=2021-10-01`,
    headers,
    data: [
      {
        op: 'add',
        value: {
          answer,
          source: 'selection',
          questions: [question],
          metadata: {},
          dialog: {
            prompts: [],
            isContextOnly: false
          },
          isDocumentText: false,
          internalRef: 1
        }
      }
    ]
  })
  // await this.deploy()
}

this.recordFact = async (rawFact) => {
  const fact = rawFact.endsWith('.') ? rawFact : rawFact + '.';
  await csvWriter.writeRecords([{ fact }]);
}

this.deploy = async () => {
  await axios({
    method: 'put',
    url: `${endpoint}/language/query-knowledgebases/projects/Hypedia/deployments/production?api-version=2021-10-01`,
    headers,
  })
}
