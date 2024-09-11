import { Address, toNano } from 'ton-core';
import { JettonMinter, JettonMinterContent, jettonContentToCellOffChain, jettonContentToCellOnChain, jettonMinterConfigToCell } from '../wrappers/JettonMinter';
import { compile, NetworkProvider, UIProvider} from '@ton-community/blueprint';
import { promptAddress, promptBool, promptUrl } from '../wrappers/ui-utils';

const formatUrl = "https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#jetton-metadata-example-offchain";
const exampleContent = {
                          name: "Seekers Alliance",
                          description: "Jetton for Seekers Alliance",
                          symbol: "SA",
                          decimals: 9,
                          image: "https://raw.githubusercontent.com/Ian0336/Ton_metadata/main/red_medal.png"
                       };
const urlPrompt = 'https://raw.githubusercontent.com/Ian0336/Ton_metadata/main/metadata.json';

export async function run(provider: NetworkProvider) {
    const ui       = provider.ui();
    const sender   = provider.sender();
    const adminPrompt = `Please specify admin address`;
    ui.write(`Jetton deployer\nCurrent deployer onli supports off-chain format:${formatUrl}`);

    let admin      = await promptAddress(adminPrompt, ui, sender.address);
    ui.write(`Admin address:${admin}\n`);
    let contentUrl = await promptUrl(urlPrompt, ui);
    ui.write(`Jetton content url:${contentUrl}`);

    let dataCorrect = false;
    do {
        ui.write("Please verify data:\n")
        ui.write(`Admin:${admin}\n\n`);
        ui.write('Metadata url:' + contentUrl);
        dataCorrect = await promptBool('Is everything ok?(y/n)', ['y','n'], ui);
        if(!dataCorrect) {
            const upd = await ui.choose('What do you want to update?', ['Admin', 'Url'], (c) => c);

            if(upd == 'Admin') {
                admin = await promptAddress(adminPrompt, ui, sender.address);
            }
            else {
                contentUrl = await promptUrl(urlPrompt, ui);
            }
        }

    } while(!dataCorrect);

    const content = jettonContentToCellOnChain({type:0,uri:contentUrl}, exampleContent);

    const wallet_code = await compile('JettonWallet');

    const minter  = JettonMinter.createFromConfig({admin,
                                                  content,
                                                  wallet_code,
                                                  }, 
                                                  await compile('JettonMinter'));

    await provider.deploy(minter, toNano('0.05'));
}
