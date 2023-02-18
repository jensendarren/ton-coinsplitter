import { Address, toNano } from 'ton-core';
import { Distributor } from '../wrappers/Distributor';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    let myAddress = Address.parse('EQBO_BKSeVRZzRhfuj3hqF-ez4g3T0af7xXCk0cve35ps83v')
    
    const distributor = Distributor.createFromConfig({
        owner: myAddress,
        processingPrice: toNano('0.01'),
        seed: 0,
        shares: [
            { address: myAddress, factor: 1, base: 2, comment: 'first half' },
            { address: myAddress, factor: 1, base: 2, comment: 'second half' }
        ]
    }, await compile('Distributor'));

    await provider.deploy(distributor, toNano('0.05'));

    const openedContract = provider.open(distributor);

    console.log(`Distributer is deployer at: ${openedContract.address}`);
}