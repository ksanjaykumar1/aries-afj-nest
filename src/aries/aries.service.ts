import { AskarModule } from '@aries-framework/askar';
import {
  Agent,
  AutoAcceptCredential,
  ConnectionsModule,
  ConsoleLogger,
  CredentialsModule,
  DidsModule,
  HttpOutboundTransport,
  InitConfig,
  KeyDidResolver,
  KeyType,
  LogLevel,
  MediationRecipientModule,
  TypedArrayEncoder,
  V2CredentialProtocol,
  WsOutboundTransport,
  utils,
} from '@aries-framework/core';
import { HttpInboundTransport, agentDependencies } from '@aries-framework/node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import { indyVdr } from '@hyperledger/indy-vdr-nodejs';
import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  LegacyIndyCredentialFormatService,
} from '@aries-framework/anoncreds';
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@aries-framework/indy-vdr';
import { ledgers } from './config';
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs';
import { anoncreds } from '@hyperledger/anoncreds-nodejs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AriesService {
  agent: Agent;
  issuerDid: string;
  provision: boolean;
  publicDidSeed: string;
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    // Initializing wallet

    // Importing ENV variables
    const label = this.configService.get('LABEL');
    const walletKey = this.configService.get('WALLET_KEY');
    const env = this.configService.get('ENV');
    const id = this.configService.get('ID');
    const mediatorInvitationUrl = this.configService.get('MEDIATOR_URL');
    this.provision = this.configService.get('PROVISION');
    this.issuerDid = this.configService.get('ISSUER_DID');
    this.publicDidSeed = this.configService.get('PUBLIC_DID_SEED');

    const agentConfig: InitConfig = {
      logger: new ConsoleLogger(env === 'dev' ? LogLevel.trace : LogLevel.info),
      label,
      walletConfig: {
        id,
        key: walletKey,
      },
    };

    const legacyIndyCredentialFormatService =
      new LegacyIndyCredentialFormatService();
    // const legacyIndyProofFormatService = new LegacyIndyProofFormatService();

    this.agent = new Agent({
      config: agentConfig,
      dependencies: agentDependencies,
      modules: {
        connections: new ConnectionsModule({
          autoAcceptConnections: true,
        }),
        mediationRecipient: new MediationRecipientModule({
          mediatorInvitationUrl,
        }),
        credentials: new CredentialsModule({
          autoAcceptCredentials: AutoAcceptCredential.Always,
          credentialProtocols: [
            new V2CredentialProtocol({
              credentialFormats: [
                new AnonCredsCredentialFormatService(),
                legacyIndyCredentialFormatService,
              ],
            }),
          ],
        }),
        anoncreds: new AnonCredsModule({
          registries: [new IndyVdrAnonCredsRegistry()],
        }),
        anoncredsRs: new AnonCredsRsModule({
          anoncreds,
        }),
        indyVdr: new IndyVdrModule({
          indyVdr,
          networks: [ledgers],
        }),
        dids: new DidsModule({
          resolvers: [new IndyVdrIndyDidResolver(), new KeyDidResolver()],
          registrars: [new IndyVdrIndyDidRegistrar()],
        }),
        askar: new AskarModule({
          ariesAskar,
        }),
      },
    });
    this.agent.registerOutboundTransport(new HttpOutboundTransport());
    this.agent.registerOutboundTransport(new WsOutboundTransport());
    // Register a simple `Http` inbound transport
    this.agent.registerInboundTransport(
      new HttpInboundTransport({ port: 3001 }),
    );
    // todo add a condition which prevents agent to initialize again and again
  }

  private async importDID() {
    console.log(this.issuerDid);
    await this.agent.dids.import({
      did: this.issuerDid,
      overwrite: true,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString(this.publicDidSeed),
        },
      ],
    });
    await this.agent.dids.create({
      method: 'indy',
      did: this.issuerDid,
    });
  }

  private async registerSchema(
    attributes: string[],
    name: string,
    version: string,
  ) {
    console.log('registerSchema......');
    try {
      if (!this.issuerDid) {
        throw new Error('Missing anoncred issuerDid');
      }

      const schemaTemplate = {
        name: name + utils.uuid(),
        version: version,
        attrNames: attributes,
        issuerId: this.issuerDid,
      };
      const { schemaState } = await this.agent.modules.anoncreds.registerSchema(
        {
          schema: schemaTemplate,
          options: {
            endorserMode: 'internal',
            endorserDid: this.issuerDid,
          },
        },
      );
      console.log(schemaState);

      if (schemaState.state !== 'finished') {
        throw new Error(
          `Error registering schema: ${
            schemaState.state === 'failed' ? schemaState.reason : 'Not Finished'
          }`,
        );
      }
      const { schemaId, schema } = schemaState;
      const {
        name: nameRes,
        version: versionRes,
        attrNames,
        issuerId,
      } = schema;

      // schema stored in prisma
      await this.prismaService.schema.create({
        data: {
          schemaId,
          name: nameRes,
          version: versionRes,
          attrNames,
          issuerId,
        },
      });

      return schemaState.schemaId;
    } catch (error) {
      console.log(error);
    }
  }

  registerCredentialDefinition = async (schemaId: string) => {
    try {
      const { credentialDefinitionState } =
        await this.agent.modules.anoncreds.registerCredentialDefinition({
          credentialDefinition: {
            schemaId: schemaId,
            issuerId: this.issuerDid,
            tag: 'latest',
          },
          options: {},
        });

      if (credentialDefinitionState.state !== 'finished') {
        throw new Error(
          `Error registering credential definition: ${
            credentialDefinitionState.state === 'failed'
              ? credentialDefinitionState.reason
              : 'Not Finished'
          }}`,
        );
      }
      console.log(credentialDefinitionState);
      const { credentialDefinitionId, credentialDefinition } =
        credentialDefinitionState;
      const {
        schemaId: schemaIdRes,
        type,
        tag,
        value,
        issuerId,
      } = credentialDefinition;
      console.log(value);
      await this.prismaService.credentialDefination.create({
        data: {
          credentialDefinitionId,
          schemaId: schemaIdRes,
          tag,
          type,
          issuerId,
        },
      });
      return credentialDefinitionId;
    } catch (error) {
      console.log(error);
    }
  };

  // provisioning agent
  async run() {
    const schemaName: string = this.configService.get('SCHEMA_NAME');
    console.log('provision state ' + this.provision);
    if (this.provision) {
      console.log('before running intialize');
      await this.agent.initialize();
      await this.importDID();
      const schemaId = await this.registerSchema(
        ['LandID', 'OwnerName', 'OwnerAadhar'],
        schemaName + utils.uuid(),
        '1.0',
      );
      await this.registerCredentialDefinition(schemaId);
    }
  }
}
