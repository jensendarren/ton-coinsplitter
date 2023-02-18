import { Blockchain } from '@ton-community/sandbox';
import { beginCell, Cell, toNano } from 'ton-core';
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
});
