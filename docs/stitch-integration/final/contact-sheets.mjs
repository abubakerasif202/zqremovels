import sharp from 'sharp';
import {readdir} from 'node:fs/promises';
for(const group of ['before','after','stitch-ref']) {
 const files=(await readdir(`docs/stitch-integration/${group}`)).filter(f=>f.endsWith('.png') && (group==='stitch-ref'||f.includes('-part'))).sort();
 const selected=files.length?files:(await readdir(`docs/stitch-integration/${group}`)).filter(f=>f.endsWith('.png')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 for(let start=0;start<selected.length;start+=24){
  const chunk=selected.slice(start,start+24), comps=[];
  for(let i=0;i<chunk.length;i++){
   const b=await sharp(`docs/stitch-integration/${group}/${chunk[i]}`).resize({width:230,height:360,fit:'inside'}).toBuffer();
   const label=Buffer.from(`<svg width="250" height="30"><text x="4" y="15" font-size="10">${chunk[i]}</text></svg>`);
   comps.push({input:b,left:(i%6)*250,top:Math.floor(i/6)*400+30},{input:label,left:(i%6)*250,top:Math.floor(i/6)*400});
  }
  await sharp({create:{width:1500,height:Math.ceil(chunk.length/6)*400,channels:3,background:'#ddd'}}).composite(comps).png().toFile(`docs/stitch-integration/final/${group}-sheet-${start}.png`);
 }
}
