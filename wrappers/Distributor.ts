import { Address, 
         beginCell, 
         Cell, 
         Contract, 
         contractAddress, 
         ContractProvider, 
         Dictionary, 
         DictionaryValue, 
         Sender, 
         SendMode, 
         toNano } from 'ton-core';

export type DistributorShare = {
    address: Address, 
    factor: number,
    base: number,
    comment: string
}

export type DistributorConfig = {
    owner: Address,
    processingPrice: bigint,
    shares: DistributorShare[],
    seed: number
};

export const Opcodes = {
    update_data: 0xfa2a76a0,
    update_code: 0x20ccb55b,
    topup: 0x59da2019,
};

const DistributorShareValue: DictionaryValue<DistributorShare> = {
    serialize: (src: DistributorShare, builder) => {
        builder
            .storeAddress(src.address)
            .storeUint(src.factor, 16)
            .storeUint(src.base, 16)
            .storeStringRefTail(src.comment)
    },
    parse: (src) => {
        return {
            address: src.loadAddress(),
            factor: src.loadUint(16),
            base: src.loadUint(16),
            comment: src.loadStringRefTail()
        }
    }
}

export function distributorConfigToCell(config: DistributorConfig): Cell {
    const shares = Dictionary.empty(Dictionary.Keys.Uint(32), DistributorShareValue)

    const totalShares = config.shares.reduce((prev, cur) => prev + cur.factor / cur.base, 0);

    if(totalShares !==1) {
        throw new Error("Total shares should be 100%");
    }

    for (let i = 0; i < config.shares.length; i++) {
        shares.set(i, config.shares[i]);
    }

    return  beginCell()
                .storeAddress(config.owner)
                .storeCoins(config.processingPrice)
                .storeDict(shares)
                .storeUint(config.seed, 16)
           .endCell();
}

export function decodeConfig(cell: Cell) {
    let slice = cell.beginParse();

    return {
        owner: slice.loadAddress().toString(),
        processingPrice: slice.loadCoins(),
        shares: slice.loadDict(Dictionary.Keys.Uint(32), DistributorShareValue).values(),
        seed: slice.loadUint(16)
    }
}

export class Distributor implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Distributor(address);
    }

    static createFromConfig(config: DistributorConfig, code: Cell, workchain = 0) {
        const data = distributorConfigToCell(config);
        const init = { code, data };
        return new Distributor(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }

    async sendUpdateData(provider: ContractProvider, via: Sender, newData: Cell) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().storeUint(Opcodes.update_data, 32).storeRef(newData).endCell()
        })
    }

    async sendUpdateCode(provider: ContractProvider, via: Sender, newCode: Cell) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().storeUint(Opcodes.update_code, 32).storeRef(newCode).endCell()
        })
    }

    async sendTopup(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().storeUint(Opcodes.topup, 32).endCell()
        })
    }

    async getProcessingPrice(provider: ContractProvider) {
        const result = await provider.get('get_processing_price', []);
        return result.stack.readBigNumber();
    }
    
    async getOwner(provider: ContractProvider) {
        const result = await provider.get('owner', []);
        return result.stack.readAddress();
    }

    async getConfig(provider: ContractProvider) {
        const configCell = await (await provider.get('config', [])).stack.readCell();
        return decodeConfig(configCell);
    }

    async getBalance(provider: ContractProvider) {
        return (await provider.getState()).balance;
    }
}

