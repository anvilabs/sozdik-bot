/* @flow */

const optionalEnvVariable = (variableName: string) => process.env[variableName];
const requiredEnvVariable = (variableName: string) => {
  const variable = optionalEnvVariable(variableName) || (
    (
      variableName !== 'SOZDIK_API_TELEGRAM_KEY' &&
      variableName !== 'SOZDIK_API_FACEBOOK_KEY' &&
      'CI' in process.env
    ) && 'test'
  );

  if (!variable) {
    throw new Error(`${variableName} environment variable is required`);
  }

  return variable;
};

const helpText = `
Просто введи слово, фразу или число, и я переведу.
Также я поддерживаю встроенный режим: просто набери \`@SozdikBot\` и любую фразу в поле сообщения и выбери подходящий тебе ответ.
`;
const startText = `
Привет! Я официальный бот sozdik.kz и могу переводить с русского на казахский и обратно.
${helpText}
Разработано: @yenbekbay\nСервис: sozdik.kz
`;
const noTranslationsFoundText = 'К сожалению, я не знаю, как это перевести 😔';
const errorText =
  'Что-то пошло не так. Пожалуйста, попробуйте еще раз чуть позже.';

export default {
  fbPageAccessToken: requiredEnvVariable('FB_PAGE_ACCESS_TOKEN'),
  fbWebhookVerifyToken: requiredEnvVariable('FB_WEBHOOK_VERIFY_TOKEN'),
  mixpanelToken: requiredEnvVariable('MIXPANEL_TOKEN'),
  papertrailOptions: {
    host: optionalEnvVariable('PAPERTRAIL_HOST'),
    port: optionalEnvVariable('PAPERTRAIL_PORT'),
  },
  port: 8080,
  sozdikApiKey: {
    telegram: requiredEnvVariable('SOZDIK_API_TELEGRAM_KEY'),
    facebook: requiredEnvVariable('SOZDIK_API_FACEBOOK_KEY'),
  },
  telegramBotToken: requiredEnvVariable('TELEGRAM_BOT_TOKEN'),
  tunnelOptions: { subdomain: 'sozdikbot' },
  isProd: optionalEnvVariable('NODE_ENV') === 'production',
  telegramWebhookUrl: `/telegram${requiredEnvVariable('TELEGRAM_BOT_TOKEN')}`,
  messengerWebhookUrl: '/messenger',
  prodUrl: 'https://sozdikbot.anvilabs.co',
  helpText,
  startText,
  noTranslationsFoundText,
  errorText,
};
