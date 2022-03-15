import {CommandInteraction, MessageAttachment} from "discord.js";
import * as CacheUtil from "../../../../utils/CacheUtil";
import * as path from "path";
import {getDatabase, getMoonrakerClient} from "../../../../Application";
import {LocaleHelper} from "../../../../helper/LocaleHelper";
import {findValue, getEntry} from "../../../../utils/CacheUtil";
import {logRegular} from "../../../../helper/LoggerHelper";

export class PreheatCommand {
    protected databaseUtil = getDatabase()
    protected localeHelper = new LocaleHelper()
    protected syntaxLocale = this.localeHelper.getSyntaxLocale()
    protected locale = this.localeHelper.getLocale()
    protected moonrakerClient = getMoonrakerClient()
    protected functionCache = getEntry('function')

    public constructor(interaction: CommandInteraction, commandId: string) {
        if(commandId !== 'preheat') { return }

        this.execute(interaction)
    }

    protected async execute(interaction: CommandInteraction) {
        const subCommand = interaction.options.getSubcommand()

        if(this.functionCache.current_status !== 'ready') {
            await interaction.reply(this.locale.messages.errors.not_ready
                .replace(/(\${username})/g, interaction.user.tag))
            return
        }

        switch (subCommand) {
            case this.syntaxLocale.commands.preheat.options.preset.name: {
                const preset = interaction.options.getString(this.syntaxLocale.commands.preheat.options.preset.options.preset.name)
                await this.heatProfile(preset)

                await interaction.reply(this.locale.messages.answers.preheat_preset
                    .replace(/(\${preset})/g, preset)
                    .replace(/(\${username})/g, interaction.user.tag))
                break
            }
            case this.syntaxLocale.commands.preheat.options.manual.name: {
                await this.heatManual(interaction)
                break
            }
        }
    }

    protected async heatManual(interaction: CommandInteraction) {
        const aviableHeaters = findValue('state.heaters.available_heaters')
        let argumentFound = false
        let heaterList = ''

        for(const heater of aviableHeaters) {
            const heaterTemp = interaction.options.getInteger(heater)
            const heaterData = findValue(`state.configfile.config.${heater}`)
            const heaterMaxTemp = Number(heaterData.max_temp)
            const heaterMinTemp = Number(heaterData.min_temp)

            if(heaterTemp === null) { continue }

            if(heaterTemp > heaterMaxTemp) {
                await interaction.reply(this.locale.messages.errors.preheat_over_max
                    .replace(/(\${max_temp})/g, heaterMaxTemp)
                    .replace(/(\${temp})/g, heaterTemp)
                    .replace(/(\${username})/g, interaction.user.tag))
                return
            }

            if(heaterTemp < heaterMinTemp) {
                await interaction.reply(this.locale.messages.errors.preheat_below_min
                    .replace(/(\${min_temp})/g, heaterMinTemp)
                    .replace(/(\${temp})/g, heaterTemp)
                    .replace(/(\${username})/g, interaction.user.tag))
                return
            }

            argumentFound = true
            heaterList = `${heater}: ${heaterTemp}C°, ${heaterList}`
            await this.heatHeater(heater, heaterTemp)
        }

        if(!argumentFound) {
            await interaction.reply(this.locale.messages.errors.preheat_missing_arguments
                .replace(/(\${username})/g, interaction.user.tag))
            return
        }

        heaterList = heaterList.slice(0, Math.max(0, heaterList.length-2))

        await interaction.reply(this.locale.messages.answers.preheat_manual
            .replace(/(\${heater_list})/g, heaterList)
            .replace(/(\${username})/g, interaction.user.tag))
    }

    protected async heatHeater(heater: string, temp: number) {
        logRegular(`set Temperatur of ${heater} to ${temp}C°...`)
        await this.moonrakerClient.send({"method": "printer.gcode.script", "params": {"script": `SET_HEATER_TEMPERATURE HEATER=${heater} TARGET=${temp}`}})
    }

    protected async heatProfile(profileName: string) {
        const preset = Object.assign({}, findValue(`config.presets.${profileName}`))

        for(const gcode in preset.gcode) {
            logRegular(`execute ${gcode}...`)
            await this.moonrakerClient.send({"method": "printer.gcode.script", "params": {"script": gcode}})
        }

        delete preset.gcode

        for(const heater in preset) {
            const heaterTemp = preset[heater]
            await this.heatHeater(heater, heaterTemp)
        }
    }
}