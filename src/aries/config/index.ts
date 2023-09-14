import { pool_transactions_bcovrin_test_genesis } from './pool_transactions_bcovrin_test_genesis';
import type { IndyVdrPoolConfig } from '@aries-framework/indy-vdr';

export const ledgers = {
  isProduction: false,
  indyNamespace: 'bcovrin:test',
  genesisTransactions: pool_transactions_bcovrin_test_genesis,
} satisfies IndyVdrPoolConfig;
