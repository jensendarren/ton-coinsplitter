import { Blockchain } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Distributor } from '../wrappers/Distributor';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Distributor', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Distributor');
    });

    it('should deploy', async () => {
        const blockchain = await Blockchain.create();

        const distributor = blockchain.openContract(Distributor.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await distributor.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: distributor.address,
            deploy: true,
        });
    });
});
