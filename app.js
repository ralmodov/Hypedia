const { App } = require('@slack/bolt');
const blocks = require('./blocks')
const kb = require('./kb')

// Initializes your app with your bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 7000,
});

// Listen for any messages, assume its a QnA question
app.message(/.+/, async ({ message, say }) => {
  const question = message.text;

  try {
    const factAnswers = await kb.requestFactAnswers(question);
    const kbAnswers = await kb.requestKbAnswers(question);

    const answers = factAnswers.concat(kbAnswers)
      .filter(a => a.answer);

    const answerSections = answers
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .flatMap(a => blocks.answerSection(question, a.answer, a.confidenceScore))

    const totalAnswerCount = answers.length;
    if (totalAnswerCount > 0) {
      await say(blocks.answers(answers[0].answer, totalAnswerCount, answerSections));
    } else {
      await say(':approval_rejected: No results found; please `/teach` me relevant info to help me answer it, or add files to the knowledge base');
    }
  } catch (error) {
    console.log(error);
    await say(blocks.code(error.stack));
  }
});

app.command('/teach', async ({ ack, body, client, logger }) => {
  // Acknowledge the action
  await ack();

  try {
    await client.views.open(blocks.teachModal(body));
  } catch (error) {
    logger.error(error);
  }
});

app.action('select_answer', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();

  const { question, answer } = JSON.parse(body.actions[0].value);
  try {
    await kb.updateQA(question, answer)
    await say(':approval_approved: Updated your question with the selected answer');
  } catch (error) {
    console.log(error)
    await say(':approval_rejected: Unable to save your question with the selected answer');
  }
});

app.view('teach_submit', async ({ ack, body, view, client, logger }) => {
  // Acknowledge the action
  await ack();

  const fact = view.state.values.block_context.input_context.value
  await kb.recordFact(fact);
  await client.chat.postMessage({
    channel: body.user.id,
    text: `:bulb-insights: learned that "${fact}"`
  })
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');
})();
