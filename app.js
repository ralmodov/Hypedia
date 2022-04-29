const { App } = require('@slack/bolt');

// Initializes your app with your bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Listens to incoming messages that contain "test_echo"
app.message('test_echo', async ({ message, say }) => {
  await say(`Echo: ${message}`);
});

(async () => {
  // Start your app
  await app.start();
  console.log('⚡️ Bolt app is running!');
})();