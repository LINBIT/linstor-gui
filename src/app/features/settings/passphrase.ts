import { patch } from '../requests';

const enterPassPhrase = (passphrase: string) => {
  return patch('/v1/encryption/passphrase', {
    body: passphrase,
  });
};

export { enterPassPhrase };
