import { toNano } from 'ton-core';
import { Distributor } from '../wrappers/Distributor';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const distributor = Distributor.createFromConfig({}, await compile('Distributor'));

    await provider.deploy(distributor, toNano('0.05'));

    const openedContract = provider.open(distributor);

    // run methods on `openedContract`
}
