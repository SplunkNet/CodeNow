import { ISysMetadata, ScriptInclude, ISysScriptInclude, Widget, ISpWidget, Theme, ISpTheme, StyleSheet, ISpCss, UiScript, ISysUiScript, SpHeaderFooter, ISpHeaderFooter, MailScript, ISysMailScript, ScriptedRestAPIResource, IScriptedRestAPIResource, ScriptAction, ISysEventScriptAction } from "./all";
import { ISysMetadataIWorkspaceConvertable } from "../MixIns/all";

export class Converter
{
    /**
     * Converts a sysmetadata to the full class implementation.
     * @param record 
     */
    static CastSysMetaData<T extends ISysMetadata>(record: T): ISysMetadataIWorkspaceConvertable | undefined
    {
        let c = <unknown>record;
        //handle conversion
        switch (record.sys_class_name)
        {
            case "sys_script_include":
                return new ScriptInclude(<ISysScriptInclude>c);
            case "sp_widget":
                return new Widget(<ISpWidget>c);
            case "sp_theme":
                return new Theme(<ISpTheme>c);
            case "sp_css":
                return new StyleSheet(<ISpCss>c);
            case "sys_ui_script":
                return new UiScript(<ISysUiScript>c);
            case "sp_header_footer":
                return new SpHeaderFooter(<ISpHeaderFooter>c);
            case "sys_script_email":
                return new MailScript(<ISysMailScript>c);
            case "sys_ws_operation":
                return new ScriptedRestAPIResource(<IScriptedRestAPIResource>c);
            case "sysevent_script_action":
                return new ScriptAction(<ISysEventScriptAction>c);
            default:
                console.warn(`GetRecord: Record ${record.sys_class_name} not recognized`);
                break;
        }
    }
}