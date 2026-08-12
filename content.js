chrome.runtime.onMessage.addListener((request)=>{

if(request.action!=="export")
    return;

const data={

match:{

vs:window.my_vs,

formation:window.v_formation,

style:window.v_playstyle,

tactics:window.v_tactics,

superBonus:window.super_bonus,

restBonus:window.rest_bonus

},

players:[]

};

for(let i=0;i<window.plr_names.length;i++){

data.players.push({

name:window.plr_names[i],

position:window.plr_pos[i],

strength:window.plr_str[i],

form:window.plr_fiza[i],

style:window.plr_styles[i],

injury:window.plr_injury[i],

disq:window.plr_disq[i],

special1:window.plr_sp1_core[i],

special1Level:window.plr_sp1_level[i],

special2:window.plr_sp2_core[i],

special2Level:window.plr_sp2_level[i]

});

}

const blob=new Blob(
[
JSON.stringify(data,null,4)
],
{
type:"application/json"
});

const url=URL.createObjectURL(blob);

const a=document.createElement("a");

a.href=url;

a.download="vsol_match.json";

a.click();

URL.revokeObjectURL(url);

});