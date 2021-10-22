import {CommandInteraction} from "discord.js";
import {EmbedHelper} from "../../../../helper/EmbedHelper";
import { TempHelper } from "../../../../helper/TempHelper";

export class TempCommand {
    protected embedHelper = new EmbedHelper()
    protected tempHelper = new TempHelper()
    public constructor(interaction: CommandInteraction, commandId: string) {
        if(commandId !== 'temp') { return }

        const fields = this.tempHelper.parseFields()

        const message = this.embedHelper.generateEmbed('temperatures', null, fields['fields'])
        
        void interaction.reply(message)
    }
}