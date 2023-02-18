import { Blockchain } from '@ton-community/sandbox';
import { beginCell, Cell, SendMode, toNano } from 'ton-core';
import { Distributor } from '../wrappers/Distributor';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

function commentBody(comment: string) {
    return beginCell()
            .storeUint(0, 32)
            .storeStringTail(comment)
           .endCell()
}

describe('Distributor', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Distributor');
    });

    it('should deploy', async () => {
        const blockchain = await Blockchain.create();

        const ownerAddress = randomAddress();

        const distributor = blockchain.openContract(
            Distributor.createFromConfig({
                owner: ownerAddress,
                processingPrice: toNano('0.05'),
                shares: [{address: randomAddress(), factor: 1, base: 1, comment: ''}],
                seed: 0
            }, code)
        );

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await distributor.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: distributor.address,
            deploy: true,
        });

        let owner = await distributor.getOwner();
        expect(ownerAddress.equals(owner)).toBe(true);
    });

    it('should distrubute coins according to shares', async () => {
        const blockchain = await Blockchain.create();
        const owner = await blockchain.treasury('owner');

        const firstShareAddress = randomAddress();
        const secondShareAddress = randomAddress();

        const distributor = blockchain.openContract(
            Distributor.createFromConfig({
                owner: owner.address,
                processingPrice: toNano('0.01'),
                seed: 0,
                shares: [
                    { address: firstShareAddress, factor: 1, base: 2, comment: 'first half' },
                    { address: secondShareAddress, factor: 1, base: 2, comment: 'second half' }
                ]
            }, code)
        );
    
        await distributor.sendDeploy(owner.getSender(), toNano('0.05'));

        const sender = await blockchain.treasury('sender');

        const result = await sender.send({
            to: distributor.address, 
            value: toNano('1'),
            sendMode: SendMode.PAY_GAS_SEPARATLY
        });

        expect(result.transactions).toHaveTransaction({
            from: distributor.address,
            to: firstShareAddress,
            value: (v) => v !== undefined && v > toNano('1') / 2n - toNano('0.01') ,
            body: (body) => body.equals(commentBody('first half'))
        });

        expect(result.transactions).toHaveTransaction({
            from: distributor.address,
            to: secondShareAddress,
            value: (v) => v !== undefined && v > toNano('1') / 2n - toNano('0.01') ,
            body: (body) => body.equals(commentBody('second half'))
        });
    })
});
