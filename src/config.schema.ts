import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  LABEL: Joi.string().required(),
  PUBLIC_DID_SEED: Joi.string().required(),
  ISSUER_DID: Joi.string().required(),
  SCHEMA_NAME: Joi.string().required(),
  AGENT_PORT: Joi.number().required(),
  WALLET_KEY: Joi.string().required(),
  ENV: Joi.string().required(),
  ID: Joi.string().required(),
  PROVISION: Joi.boolean().required(),
});
