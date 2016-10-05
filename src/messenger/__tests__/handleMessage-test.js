/* @flow */

/* eslint-disable import/imports-first */

import { getTranslationsForQuery } from '../../sozdikApi';
import { trackUser, trackEvent } from '../../analytics';
import createLogger from '../../createLogger';
import curriedHandleMessage from '../handleMessage';
import env from '../../env';

const { noTranslationsFoundText, errorText } = env;
const sampleHandleMessageConfig = {
  recipientId: '123',
};
const sampleUserProfile = {
  first_name: 'John',
  last_name: 'Doe',
};

const sendTextMessage = jest.fn();
const sendSenderAction = jest.fn();
const getUserProfile = jest.fn(() => Promise.resolve(sampleUserProfile));
const logger = createLogger('test');

describe('handleMessage', () => {
  let handleMessage;

  beforeAll(() => {
    handleMessage = curriedHandleMessage({
      sendTextMessage,
      sendSenderAction,
      getUserProfile,
      logger,
    });
  });

  beforeEach(() => {
    (getTranslationsForQuery: any).mockClear();
    (trackUser: any).mockClear();
    (trackEvent: any).mockClear();
    sendTextMessage.mockClear();
    sendSenderAction.mockClear();
    getUserProfile.mockClear();
    logger.error.mockClear();
  });

  it('replies with translations', async () => {
    const text = 'Словарь';

    await handleMessage({
      ...sampleHandleMessageConfig,
      message: { text },
    });

    expect(getUserProfile)
      .toHaveBeenCalledWith(sampleHandleMessageConfig.recipientId);
    expect(getTranslationsForQuery).toHaveBeenCalledWith(text.toLowerCase());
    expect(sendSenderAction).toHaveBeenCalledWith({
      recipientId: sampleHandleMessageConfig.recipientId,
      action: 'typing_on',
    });
    expect(trackUser).toHaveBeenCalledWith({
      id: sampleHandleMessageConfig.recipientId,
      ...sampleUserProfile,
    });
    expect(trackEvent).toHaveBeenCalledWith(
      sampleHandleMessageConfig.recipientId,
      'Requested translations',
      {
        query: text,
        kk_translation: true,
        ru_translation: false,
      },
    );
    expect(sendTextMessage).toHaveBeenCalledWith({
      recipientId: sampleHandleMessageConfig.recipientId,
      text: 'title:\ntext',
    });
  });

  it('returns early for an ineligible query', async () => {
    await handleMessage({
      ...sampleHandleMessageConfig,
      message: { text: '' },
    });

    expect(getUserProfile).not.toHaveBeenCalled();
    expect(getTranslationsForQuery).not.toHaveBeenCalled();
    expect(sendSenderAction).not.toHaveBeenCalled();
    expect(trackUser).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
    expect(sendTextMessage).not.toHaveBeenCalled();
  });

  it('sends a predefined message if no translations were found', async () => {
    await handleMessage({
      ...sampleHandleMessageConfig,
      message: { text: 'Блаблабла' },
    });

    expect(sendTextMessage).toHaveBeenCalledWith({
      recipientId: sampleHandleMessageConfig.recipientId,
      text: noTranslationsFoundText,
    });
  });

  it('catches errors from messenger platform', async () => {
    (getTranslationsForQuery: any).mockImplementationOnce(
      () => Promise.reject(new Error()),
    );

    await handleMessage({
      ...sampleHandleMessageConfig,
      message: { text: 'Блаблабла' },
    });

    expect(logger.error).toHaveBeenCalled();
    expect(sendTextMessage).toHaveBeenCalledWith({
      recipientId: sampleHandleMessageConfig.recipientId,
      text: errorText,
    });
  });
});