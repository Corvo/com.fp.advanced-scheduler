'use strict';

import { App as HomeyApp } from "homey";
import { ManagerSettings } from "homey";

import { Schedule, ScheduleItem, Token, TimeType, DaysType, TokenItem } from "../src/containerclasses";


export class Settings {
    private homeyApp:HomeyApp;
    
    schedules:Schedule[]; //Lets expose it publicly for now, refactor later.

    constructor(homeyApp:HomeyApp) {
        this.homeyApp=homeyApp;
        this.schedules = new Array();
    }
  
    readSettings() {
        if (this.homeyApp != null) this.homeyApp.log('Reading settings...');

            try {
                let rs = ManagerSettings.get('settings');
                if (rs == null) { 
                    if (this.homeyApp != null) this.homeyApp.log('Settings not found, starting blank')
                    return;
                }

                let jsonsettings = JSON.parse(rs);
                if (jsonsettings == null) { 
                    if (this.homeyApp != null) this.homeyApp.log('Settings not possible to parse, starting blank')
                    return;
                }
        
                this.schedules = new Array();
                
                jsonsettings.settings.schedules.forEach(sched => {
                    let localschedule = new Schedule(parseInt(sched.id),sched.name, Boolean(sched.active));
                    sched.tokens.forEach (token => {
                        let localtoken = new Token(parseInt(token.id), token.name, token.type)   
                        localschedule.tokens.push(localtoken);            
                    });    
                    sched.scheduleitems.forEach(si => {
                        let dt:DaysType;
                        switch (si.daystype){
                            case 'daysofweek': { dt = DaysType.DaysOfWeek; break; }
                            case 'daysofmonth': { dt = DaysType.DaysOfMonth; break; }
                        }
                        let tt:TimeType;
                        switch (si.timetype){
                            case 'timeofday': { tt = TimeType.TimeOfDay; break; }
                            case 'solar': { tt = TimeType.Solar; break; }
                        }
                        let localsi = new ScheduleItem(parseInt(si.id), dt, si.daysarg, tt, si.timearg);
                        
                        si.tokenitems.forEach(ti => {
                            let localtoken = localschedule.tokens.find(t=>t.id==ti.id)
                            let localtokenitem:TokenItem;
                            if (localtoken.type == 'boolean') { localtokenitem = new TokenItem(localtoken,Boolean(ti.value)); }
                            else if (localtoken.type == 'string') { localtokenitem = new TokenItem(localtoken,ti.value); }
                            else if (localtoken.type == 'number') { localtokenitem = new TokenItem(localtoken,Number(ti.value)); }
                            else { if (this.homeyApp != null) this.homeyApp.log('Incorrect type for tokenitem'); }

                            localsi.tokenitems.push(localtokenitem);
                        });

                        localschedule.scheduleitems.push(localsi);            
                    });     
        
                    this.schedules.push(localschedule);
                });

                if (this.homeyApp != null) this.homeyApp.log('Settings read');
                    
            } catch (error) {
                if (this.homeyApp != null) this.homeyApp.log('Settings NOT read!');
                if (this.homeyApp != null) this.homeyApp.log('Error: ' + error);
            }

    }
}

//module.exports = Settings;