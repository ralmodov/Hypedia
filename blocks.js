const slackifyMarkdown = require('slackify-markdown');

// Slack throws an error past this limit
const blockLimit = 1000;

this.answerSection = (question, rawAnswer, confidenceScore) => {
  const mrkdwnAnswer = slackifyMarkdown(rawAnswer);
  const answer = mrkdwnAnswer.length < blockLimit ? mrkdwnAnswer : mrkdwnAnswer.substring(0, blockLimit);
  if (answer.length === 0) return [];

  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": answer
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": ":approval_approved:"
        },
        "action_id": 'select_answer',
        "value": JSON.stringify({ question, answer })
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `_Certainty: ${confidenceScore.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 1 })}_`
        }
      ]
    },
    {
      "type": "divider"
    }
  ]
}

this.teachModal = (body) => {
  return {
    // Pass a valid trigger_id within 3 seconds of receiving it
    trigger_id: body.trigger_id,
    // View payload
    view: {
      type: 'modal',
      // View identifier
      callback_id: 'teach_submit',
      title: {
        type: 'plain_text',
        text: 'Teach'
      },
      blocks: [
        {
          type: "input",
          block_id: "block_context",
          element: {
            type: "plain_text_input",
            multiline: true,
            initial_value: body.text || '',
            action_id: "input_context",
            placeholder: {
              type: "plain_text",
              text: "Write any general fact to teach Hypedia."
            }
          },
          label: {
            type: "plain_text",
            text: ":books: Teach Hypedia something new!",
            emoji: true
          }
        },
      ],
      submit: {
        type: 'plain_text',
        text: 'Teach'
      }
    }
  }
}

this.answers = (text, totalAnswerCount, answerSections) => {
  return {
    text,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:mag: *Found ${totalAnswerCount} ${totalAnswerCount > 1 ? 'answers' : 'answer'}*`
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": '_Please select the most relevant one to help improve future prediction accuracy, or choose to leave it unanswered so someone else can answer._'
          }
        ]
      },
      {
        "type": "divider"
      },
      ...answerSections,
      // TODO also add option to teach and leave unanswered
    ]
  }
}

this.code = (message) => `\`\`\`${message}\`\`\``;
