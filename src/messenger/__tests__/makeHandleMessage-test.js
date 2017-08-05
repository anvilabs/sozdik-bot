/* @flow */

import {trackUser, trackEvent} from 'src/analytics';
import makeLogger from 'src/makeLogger';
import config from 'src/config';
import getSozdikApi from 'src/getSozdikApi';

import makeHandleMessage from '../makeHandleMessage';

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
const {getTranslationsForQuery} = getSozdikApi('facebook');
const logger = makeLogger('test');

describe('makeHandleMessage', () => {
  let handleMessage;

  beforeAll(() => {
    handleMessage = makeHandleMessage({
      sendTextMessage,
      sendSenderAction,
      getUserProfile,
      getTranslationsForQuery,
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
      message: {text},
    });

    expect(getUserProfile).toHaveBeenCalledWith(
      sampleHandleMessageConfig.recipientId,
    );
    expect(getTranslationsForQuery).toHaveBeenCalledWith(text.toLowerCase());
    expect(sendSenderAction).toHaveBeenCalledWith({
      recipientId: sampleHandleMessageConfig.recipientId,
      action: 'typing_on',
    });
    expect(trackUser).toHaveBeenCalledWith({
      id: sampleHandleMessageConfig.recipientId,
      ...sampleUserProfile,
    });
    expect(
      trackEvent,
    ).toHaveBeenCalledWith(
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
      message: {text: ''},
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
      message: {text: 'Блаблабла'},
    });

    expect(sendTextMessage).toHaveBeenCalledWith({
      recipientId: sampleHandleMessageConfig.recipientId,
      text: config.noTranslationsFoundText,
    });
  });

  it('catches errors from messenger platform', async () => {
    (getTranslationsForQuery: any).mockImplementationOnce(() =>
      Promise.reject(new Error()),
    );

    await handleMessage({
      ...sampleHandleMessageConfig,
      message: {text: 'Блаблабла'},
    });

    expect(logger.error).toHaveBeenCalled();
    expect(sendTextMessage).toHaveBeenCalledWith({
      recipientId: sampleHandleMessageConfig.recipientId,
      text: config.errorText,
    });
  });
});
